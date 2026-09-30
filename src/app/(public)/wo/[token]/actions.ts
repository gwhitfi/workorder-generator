"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getAppUrl, sendEmail } from "@/lib/email";
import { completedEmail } from "@/lib/emails/completedEmail";
import { formatWorkOrderAddress } from "@/lib/workOrders";

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
    if (lineItem.area.workOrder.archived || !isOpen(lineItem.area.workOrder.status)) {
        throw new Error("Work order is not open");
    }

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

function loadForCompletion(token: string) {
    return prisma.workOrder.findUnique({
        where: { publicToken: token },
        include: {
            organization: { select: { name: true, email: true } },
            property: true,
            unit: true,
            areas: {
                orderBy: { sortOrder: "asc" },
                include: { lineItems: { orderBy: { sortOrder: "asc" } } },
            },
        },
    });
}

type CompletionWorkOrder = NonNullable<Awaited<ReturnType<typeof loadForCompletion>>>;

export async function completeWorkOrder(token: string, completionNotes: string) {
    const workOrder = await loadForCompletion(token);

    if (!workOrder) throw new Error("Invalid work order");
    if (workOrder.archived || !isOpen(workOrder.status)) throw new Error("Work order is not open");

    const completedAt = new Date();
    const notes = cleanNote(completionNotes);

    await prisma.workOrder.update({
        where: { id: workOrder.id },
        data: { status: "COMPLETED", completedAt, completionNotes: notes },
    });

    revalidate(token, workOrder.id);

    after(() => notifyOffice({ ...workOrder, completedAt, completionNotes: notes }));
}

async function notifyOffice(workOrder: CompletionWorkOrder) {
    const to = workOrder.organization.email;
    if (!to) {
        console.info(`No office email set; skipped completion notice for work order ${workOrder.id}`);
        return;
    }

    try {
        const email = completedEmail({
            organizationName: workOrder.organization.name,
            contractorName: workOrder.contractorName,
            contractorEmail: workOrder.contractorEmail,
            title: workOrder.title,
            address: formatWorkOrderAddress(workOrder.property, workOrder.unit),
            completedAt: workOrder.completedAt ?? new Date(),
            completionNotes: workOrder.completionNotes,
            areas: workOrder.areas,
            url: `${getAppUrl()}/work-orders/${workOrder.id}`,
        });

        await sendEmail({ to, ...email, replyTo: workOrder.contractorEmail });
    } catch (error) {
        console.error(`Completion notice failed for work order ${workOrder.id}`, error);
    }
}
