"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_NOTE_LENGTH = 2000;
const OPEN_STATUSES = ["SENT", "IN_PROGRESS"] as const;

function isOpen(status: string) {
    return (OPEN_STATUSES as readonly string[]).includes(status);
}

function cleanNote(note: string) {
    const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);
    return trimmed || null;
}

async function getOpenLineItem(token: string, lineItemId: string) {
    const lineItem = await prisma.lineItem.findFirst({
        where: { id: lineItemId, area: { workOrder: { publicToken: token } } },
        include: { area: { include: { workOrder: true } } },
    });

    if (!lineItem) throw new Error("Invalid line item");
    if (!isOpen(lineItem.area.workOrder.status)) throw new Error("Work order is not open");

    return lineItem;
}

function revalidate(token: string, workOrderId: string) {
    revalidatePath(`/wo/${token}`);
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
}

export async function toggleLineItem(token: string, lineItemId: string) {
    const lineItem = await getOpenLineItem(token, lineItemId);
    const workOrder = lineItem.area.workOrder;
    const completed = !lineItem.completed;

    await prisma.$transaction([
        prisma.lineItem.update({
            where: { id: lineItemId },
            data: { completed, completedAt: completed ? new Date() : null },
        }),
        ...(completed && workOrder.status === "SENT"
            ? [prisma.workOrder.update({ where: { id: workOrder.id }, data: { status: "IN_PROGRESS" } })]
            : []),
    ]);

    revalidate(token, workOrder.id);
}

export async function saveLineItemNote(token: string, lineItemId: string, note: string) {
    const lineItem = await getOpenLineItem(token, lineItemId);

    await prisma.lineItem.update({
        where: { id: lineItemId },
        data: { contractorNotes: cleanNote(note) },
    });

    revalidate(token, lineItem.area.workOrderId);
}

export async function completeWorkOrder(token: string, completionNotes: string) {
    const workOrder = await prisma.workOrder.findUnique({ where: { publicToken: token } });

    if (!workOrder) throw new Error("Invalid work order");
    if (!isOpen(workOrder.status)) throw new Error("Work order is not open");

    await prisma.workOrder.update({
        where: { id: workOrder.id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            completionNotes: cleanNote(completionNotes),
        },
    });

    revalidate(token, workOrder.id);
}
