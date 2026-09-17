"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LineItemPriority } from "@/generated/prisma/enums";

export async function createWorkOrder(formData: FormData) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const title = (formData.get("title") as string) || null;
    const propertyId = formData.get("propertyId") as string;
    const unitId = (formData.get("unitId") as string) || null;
    const contractorId = (formData.get("contractorId") as string) || null;
    const notes = (formData.get("notes") as string) || null;
    const notifyTenant = formData.get("tenant") === "on";
    const dueDateRaw = (formData.get("dueDate") as string) || null;
    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;

    const property = await prisma.property.findFirst({
        where: { id: propertyId, organizationId: result.organization.id },
    });

    if (!property) throw new Error("Invalid property");

    if (unitId) {
        const unit = await prisma.unit.findFirst({
            where: { id: unitId, organizationId: result.organization.id },
        });
        if (!unit) throw new Error("Invalid unit");
    }

    let contractor = null;

    if (contractorId) {
        contractor = await prisma.contact.findFirst({
            where: {
                id: contractorId,
                organizationId: result.organization.id,
                contactType: { in: ["CONTRACTOR", "OTHER"] },
            },
        });
        if (!contractor) throw new Error("Invalid contractor");
    }

    const tenant = unitId
        ? await prisma.contact.findFirst({
              where: {
                  unitId,
                  contactType: "TENANT",
                  organizationId: result.organization.id,
                  archived: false,
              },
          })
        : null;

    const workOrder = await prisma.workOrder.create({
        data: {
            organizationId: result.organization.id,
            propertyId,
            unitId,
            title,
            notes,
            dueDate,
            notifyTenant,
            status: "DRAFT",

            contractorId,
            contractorName: contractor?.displayName ?? null,
            contractorPhone: contractor?.phone ?? null,
            contractorEmail: contractor?.email ?? null,

            tenantId: tenant?.id ?? null,
            tenantName: tenant?.displayName ?? null,
            tenantPhone: tenant?.phone ?? null,
            tenantEmail: tenant?.email ?? null,
        },
    });

    revalidatePath("/work-orders");
    redirect(`/work-orders/${workOrder.id}`);
}

export async function addArea(workOrderId: string, spaceId: string | null, name: string) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    if (spaceId) {
        const space = await prisma.space.findFirst({
            where: { id: spaceId, organizationId: result.organization.id },
        });

        if (!space) throw new Error("Invalid space");
    }

    const last = await prisma.area.findFirst({
        where: { workOrderId },
        orderBy: { sortOrder: "desc" },
    });

    const sortOrder = last ? last.sortOrder + 1 : 0;

    await prisma.area.create({
        data: {
            workOrderId,
            spaceId,
            name,
            sortOrder,
        },
    });
    revalidatePath(`/work-orders/${workOrderId}`);
}

export async function removeArea(areaId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const area = await prisma.area.findFirst({
        where: { id: areaId },
        include: { workOrder: true },
    });

    if (!area || area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid area");
    }

    await prisma.area.delete({ where: { id: areaId } });
    revalidatePath(`/work-orders/${area.workOrderId}`);
}

export async function moveArea(areaId: string, direction: "up" | "down") {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const area = await prisma.area.findFirst({
        where: { id: areaId },
        include: { workOrder: true },
    });

    if (!area || area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid area");
    }

    const neighbour = await prisma.area.findFirst({
        where: {
            workOrderId: area.workOrderId,
            sortOrder: direction === "up" ? { lt: area.sortOrder } : { gt: area.sortOrder },
        },
        orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbour) return;

    await prisma.$transaction([
        prisma.area.update({
            where: { id: area.id },
            data: { sortOrder: neighbour.sortOrder },
        }),
        prisma.area.update({
            where: { id: neighbour.id },
            data: { sortOrder: area.sortOrder },
        }),
    ]);

    revalidatePath(`/work-orders/${area.workOrderId}`);
}

export async function addLineItem(areaId: string, description: string, priority: LineItemPriority) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const area = await prisma.area.findFirst({
        where: { id: areaId },
        include: { workOrder: true },
    });

    if (!area || area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid area");
    }

    const last = await prisma.lineItem.findFirst({
        where: { areaId },
        orderBy: { sortOrder: "desc" },
    });
    const sortOrder = last ? last.sortOrder + 1 : 0;

    await prisma.lineItem.create({
        data: {
            areaId,
            description,
            priority,
            sortOrder,
        },
    });
    revalidatePath(`/work-orders/${area.workOrderId}`);
}
