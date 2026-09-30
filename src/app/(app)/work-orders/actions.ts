"use server";

import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DeliveryMethod, LineItemPriority } from "@/generated/prisma/enums";
import { getAppUrl, sendEmail } from "@/lib/email";
import { workOrderEmail } from "@/lib/emails/workOrderEmail";
import { notifyContractorsCancelled } from "@/lib/emails/notifyCancelled";
import { DELETE_NOT_CONFIRMED, isDeleteConfirmed } from "@/lib/confirmDelete";
import { formatWorkOrderAddress } from "@/lib/workOrders";
import { todayInAppTimeZone } from "@/lib/dates";

async function readWorkOrderForm(formData: FormData, organizationId: string, propertyId: string) {
    const unitId = (formData.get("unitId") as string) || null;
    const contractorId = (formData.get("contractorId") as string) || null;
    const dueDateRaw = (formData.get("dueDate") as string) || null;

    if (unitId) {
        const unit = await prisma.unit.findFirst({ where: { id: unitId, propertyId, organizationId } });
        if (!unit) throw new Error("Invalid unit");
    }

    const contractor = contractorId
        ? await prisma.contact.findFirst({
              where: { id: contractorId, organizationId, contactType: { in: ["CONTRACTOR", "OTHER"] } },
          })
        : null;
    if (contractorId && !contractor) throw new Error("Invalid contractor");

    return {
        title: (formData.get("title") as string) || null,
        notes: (formData.get("notes") as string) || null,
        notifyTenant: formData.get("tenant") === "on",
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
        unitId,
        contractor,
    };
}

function findTenant(unitId: string | null, organizationId: string) {
    if (!unitId) return null;
    return prisma.contact.findFirst({
        where: { unitId, contactType: "TENANT", organizationId, archived: false },
    });
}

function contractorSnapshot(
    contractor: { id: string; displayName: string; phone: string | null; email: string | null } | null,
) {
    return {
        contractorId: contractor?.id ?? null,
        contractorName: contractor?.displayName ?? null,
        contractorPhone: contractor?.phone ?? null,
        contractorEmail: contractor?.email ?? null,
    };
}

function tenantSnapshot(
    tenant: { id: string; displayName: string; phone: string | null; email: string | null } | null,
) {
    return {
        tenantId: tenant?.id ?? null,
        tenantName: tenant?.displayName ?? null,
        tenantPhone: tenant?.phone ?? null,
        tenantEmail: tenant?.email ?? null,
    };
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function nextJobNumber(tx: Tx, organizationId: string) {
    const year = todayInAppTimeZone().getUTCFullYear();
    const [row] = await tx.$queryRaw<{ lastJobNumber: number }[]>`
        UPDATE "Organization"
        SET "lastJobNumber" = CASE WHEN "jobNumberYear" = ${year} THEN "lastJobNumber" + 1 ELSE 1001 END,
            "jobNumberYear" = ${year}
        WHERE "id" = ${organizationId}
        RETURNING "lastJobNumber"`;
    return `${year}-${row.lastJobNumber}`;
}

export async function createWorkOrder(formData: FormData) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const organizationId = result.organization.id;
    const propertyId = formData.get("propertyId") as string;

    const property = await prisma.property.findFirst({
        where: { id: propertyId, organizationId },
    });

    if (!property) throw new Error("Invalid property");

    const { contractor, ...fields } = await readWorkOrderForm(formData, organizationId, propertyId);
    const tenant = await findTenant(fields.unitId, organizationId);

    const workOrder = await prisma.$transaction(async (tx) =>
        tx.workOrder.create({
            data: {
                organizationId,
                jobNumber: await nextJobNumber(tx, organizationId),
                publicToken: randomBytes(24).toString("base64url"),
                propertyId,
                ...fields,
                status: "DRAFT",
                ...contractorSnapshot(contractor),
                ...tenantSnapshot(tenant),
            },
        }),
    );

    revalidatePath("/work-orders");
    redirect(`/work-orders/${workOrder.id}`);
}

export async function updateWorkOrder(workOrderId: string, formData: FormData) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const organizationId = result.organization.id;
    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId, archived: false },
    });

    if (!workOrder) throw new Error("Invalid work order");
    if (!["DRAFT", "SENT", "IN_PROGRESS"].includes(workOrder.status)) {
        throw new Error("Only open work orders can be edited");
    }

    const { contractor, ...fields } = await readWorkOrderForm(formData, organizationId, workOrder.propertyId);
    const contractorChanged = (contractor?.id ?? null) !== workOrder.contractorId;
    const unitChanged = fields.unitId !== workOrder.unitId;
    const newLink = contractorChanged && workOrder.status !== "DRAFT";

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            ...fields,
            ...(contractorChanged ? contractorSnapshot(contractor) : {}),
            ...(unitChanged ? tenantSnapshot(await findTenant(fields.unitId, organizationId)) : {}),
            ...(newLink ? { publicToken: randomBytes(24).toString("base64url"), deliveryMethod: null } : {}),
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
    if (newLink) revalidatePath(`/wo/${workOrder.publicToken}`);
    redirect(`/work-orders/${workOrderId}${newLink && contractor ? "?contractorChanged=1" : ""}`);
}

export async function archiveWorkOrder(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: { property: true, unit: true },
    });
    if (!workOrder) throw new Error("Invalid work order");

    const willCancel = !workOrder.archived && (workOrder.status === "SENT" || workOrder.status === "IN_PROGRESS");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: willCancel ? { archived: true, status: "CANCELLED", cancelledAt: new Date() } : { archived: true },
    });

    if (willCancel) {
        notifyContractorsCancelled(result.organization, [
            { ...workOrder, address: formatWorkOrderAddress(workOrder.property, workOrder.unit) },
        ]);
    }

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
    revalidatePath("/");
    redirect("/work-orders");
}

export async function restoreWorkOrder(workOrderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await getCurrentUser();
    if (result.state !== "ready") return { ok: false, error: "Not authorized" };

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: { property: { select: { archived: true } } },
    });
    if (!workOrder) return { ok: false, error: "Work order not found" };
    if (workOrder.property.archived) {
        return { ok: false, error: "This work order's property is archived. Restore the property first." };
    }

    await prisma.workOrder.update({ where: { id: workOrderId }, data: { archived: false } });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
    return { ok: true };
}

export async function deleteWorkOrder(
    workOrderId: string,
    confirmation: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isDeleteConfirmed(confirmation)) return DELETE_NOT_CONFIRMED;

    const result = await getCurrentUser();
    if (result.state !== "ready") return { ok: false, error: "Not authorized" };

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: { property: true, unit: true },
    });
    if (!workOrder) return { ok: false, error: "Work order not found" };

    // Areas, line items and attachments cascade.
    await prisma.workOrder.delete({ where: { id: workOrderId } });

    if (!workOrder.archived && ["SENT", "IN_PROGRESS"].includes(workOrder.status)) {
        notifyContractorsCancelled(result.organization, [
            { ...workOrder, address: formatWorkOrderAddress(workOrder.property, workOrder.unit) },
        ]);
    }

    revalidatePath("/work-orders");
    revalidatePath(`/properties/${workOrder.propertyId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
    revalidatePath("/");
    redirect("/work-orders");
}

export async function addArea(workOrderId: string, name: string) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    const last = await prisma.area.findFirst({
        where: { workOrderId },
        orderBy: { sortOrder: "desc" },
    });

    const sortOrder = last ? last.sortOrder + 1 : 0;

    await prisma.area.create({
        data: {
            workOrderId,
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

export async function removeLineItem(lineItemId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const lineItem = await prisma.lineItem.findFirst({
        where: { id: lineItemId },
        include: {
            area: {
                include: { workOrder: true },
            },
        },
    });

    if (!lineItem || lineItem.area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid line item");
    }

    await prisma.lineItem.delete({ where: { id: lineItemId } });
    revalidatePath(`/work-orders/${lineItem.area.workOrderId}`);
}

export async function moveLineItem(lineItemId: string, direction: "up" | "down") {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const lineItem = await prisma.lineItem.findFirst({
        where: { id: lineItemId },
        include: {
            area: { include: { workOrder: true } },
        },
    });

    if (!lineItem || lineItem.area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid line item");
    }

    const neighbour = await prisma.lineItem.findFirst({
        where: {
            areaId: lineItem.areaId,
            sortOrder: direction === "up" ? { lt: lineItem.sortOrder } : { gt: lineItem.sortOrder },
        },
        orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (!neighbour) return;

    await prisma.$transaction([
        prisma.lineItem.update({
            where: { id: lineItem.id },
            data: { sortOrder: neighbour.sortOrder },
        }),
        prisma.lineItem.update({
            where: { id: neighbour.id },
            data: { sortOrder: lineItem.sortOrder },
        }),
    ]);

    revalidatePath(`/work-orders/${lineItem.area.workOrderId}`);
}

export async function updateLineItem(lineItemId: string, description: string, priority: LineItemPriority) {
    const reuslt = await getCurrentUser();
    if (reuslt.state !== "ready") throw new Error("Not authorized");

    const lineItem = await prisma.lineItem.findFirst({
        where: { id: lineItemId },
        include: {
            area: { include: { workOrder: true } },
        },
    });

    if (!lineItem || lineItem.area.workOrder.organizationId !== reuslt.organization.id) {
        throw new Error("Invalid line item");
    }

    await prisma.lineItem.update({
        where: { id: lineItemId },
        data: { description, priority },
    });

    revalidatePath(`/work-orders/${lineItem.area.workOrderId}`);
}

export async function sendWorkOrder(workOrderId: string, deliveryMethod: DeliveryMethod) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: { contractor: true },
    });

    if (!workOrder) throw new Error("Invalid work order");
    if (!workOrder.contractorId) throw new Error("Assign a contractor before sending");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            status: "SENT",
            sentAt: new Date(),
            deliveryMethod,
            contractorName: workOrder.contractor?.displayName ?? null,
            contractorPhone: workOrder.contractor?.phone ?? null,
            contractorEmail: workOrder.contractor?.email ?? null,
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
}

type EmailResult = { ok: true; to: string } | { ok: false; error: string };

export async function emailWorkOrder(workOrderId: string): Promise<EmailResult> {
    const result = await getCurrentUser();
    if (result.state !== "ready") return { ok: false, error: "Not authorized" };

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: {
            contractor: true,
            property: true,
            unit: true,
        },
    });

    if (!workOrder) return { ok: false, error: "Work order not found" };
    if (workOrder.archived) return { ok: false, error: "Archived work orders can't be emailed" };
    if (!["DRAFT", "SENT", "IN_PROGRESS"].includes(workOrder.status)) {
        return { ok: false, error: "Only open work orders can be emailed" };
    }
    if (!workOrder.contractor) return { ok: false, error: "Assign a contractor before sending" };

    const to = workOrder.contractor.email?.trim();
    if (!to) return { ok: false, error: `${workOrder.contractor.displayName} has no email address` };

    const itemCount = await prisma.lineItem.count({ where: { area: { workOrderId } } });
    const address = formatWorkOrderAddress(workOrder.property, workOrder.unit);

    try {
        const email = workOrderEmail({
            organization: result.organization,
            title: workOrder.title,
            jobNumber: workOrder.jobNumber,
            address,
            dueDate: workOrder.dueDate,
            notes: workOrder.notes,
            itemCount,
            url: `${getAppUrl()}/wo/${workOrder.publicToken}`,
            isResend: workOrder.deliveryMethod === "EMAIL",
        });

        await sendEmail({ to, ...email, replyTo: result.organization.email, fromName: result.organization.name });
    } catch (error) {
        console.error("emailWorkOrder failed", error);
        return { ok: false, error: error instanceof Error ? error.message : "Email failed to send" };
    }

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            deliveryMethod: "EMAIL",
            contractorName: workOrder.contractor.displayName,
            contractorPhone: workOrder.contractor.phone,
            contractorEmail: workOrder.contractor.email,
            ...(workOrder.status === "DRAFT" ? { status: "SENT", sentAt: new Date() } : {}),
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
    return { ok: true, to };
}

export async function markWorkOrderCompleted(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
}

export async function reopenWorkOrder(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            status: workOrder.sentAt ? "SENT" : "DRAFT",
            closedAt: null,
            completedAt: null,
            cancelledAt: null,
            cancelReason: null,
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
}

export async function closeWorkOrder(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");
    if (workOrder.status !== "COMPLETED") throw new Error("Only completed work orders can be closed");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            status: "CLOSED",
            closedAt: new Date(),
        },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
}

export async function cancelWorkOrder(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
        include: { property: true, unit: true },
    });

    if (!workOrder) throw new Error("Invalid work order");
    if (workOrder.status !== "SENT" && workOrder.status !== "IN_PROGRESS") {
        throw new Error("Only sent or in-progress work orders can be cancelled");
    }

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    if (!workOrder.archived) {
        notifyContractorsCancelled(result.organization, [
            { ...workOrder, address: formatWorkOrderAddress(workOrder.property, workOrder.unit) },
        ]);
    }

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath("/work-orders");
    revalidatePath(`/wo/${workOrder.publicToken}`);
    revalidatePath("/");
}

export async function regeneratePublicToken(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { publicToken: randomBytes(24).toString("base64url") },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
}
