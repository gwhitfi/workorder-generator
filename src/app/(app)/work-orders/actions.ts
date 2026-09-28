"use server";

import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DeliveryMethod, LineItemPriority } from "@/generated/prisma/enums";
import { getAppUrl, sendEmail } from "@/lib/email";
import { workOrderEmail } from "@/lib/emails/workOrderEmail";

// Reads and validates the fields shared by the create and edit forms. The property is passed in
// separately because it can't be changed once a work order exists.
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

    const workOrder = await prisma.workOrder.create({
        data: {
            organizationId,
            publicToken: randomBytes(24).toString("base64url"),
            propertyId,
            ...fields,
            status: "DRAFT",
            ...contractorSnapshot(contractor),
            ...tenantSnapshot(tenant),
        },
    });

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
    // Once sent, the old contractor still has the link, so a new contractor gets a new one.
    const newLink = contractorChanged && workOrder.status !== "DRAFT";

    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
            ...fields,
            ...(contractorChanged ? contractorSnapshot(contractor) : {}),
            ...(unitChanged ? tenantSnapshot(await findTenant(fields.unitId, organizationId)) : {}),
            // The new contractor hasn't been sent anything yet, so their first email isn't a "reminder".
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
    });
    if (!workOrder) throw new Error("Invalid work order");

    await prisma.workOrder.update({ where: { id: workOrderId }, data: { archived: true } });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
    redirect("/work-orders");
}

export async function restoreWorkOrder(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });
    if (!workOrder) throw new Error("Invalid work order");

    await prisma.workOrder.update({ where: { id: workOrderId }, data: { archived: false } });

    revalidatePath("/work-orders");
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
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

export async function toggleTag(lineItemId: string, tagId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const lineItem = await prisma.lineItem.findFirst({
        where: { id: lineItemId },
        include: {
            tags: true,
            area: { include: { workOrder: true } },
        },
    });

    if (!lineItem || lineItem.area.workOrder.organizationId !== result.organization.id) {
        throw new Error("Invalid line item");
    }

    const tag = await prisma.tag.findFirst({
        where: { id: tagId, organizationId: result.organization.id },
    });

    if (!tag) throw new Error("Invalid tag");

    const alreadyTagged = lineItem.tags.some((t) => t.id === tagId);

    await prisma.lineItem.update({
        where: { id: lineItemId },
        data: {
            tags: alreadyTagged ? { disconnect: { id: tagId } } : { connect: { id: tagId } },
        },
    });

    revalidatePath(`/work-orders/${lineItem.area.workOrderId}`);
}

export async function createTag(name: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const last = await prisma.tag.findFirst({
        where: { organizationId: result.organization.id },
        orderBy: { sortOrder: "desc" },
    });

    return await prisma.tag.create({
        data: {
            name,
            organizationId: result.organization.id,
            sortOrder: last ? last.sortOrder + 1 : 0,
        },
    });
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

// Returns a result instead of throwing so the message reaches the UI (thrown errors are hidden in production).
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
    const { property, unit } = workOrder;
    const address =
        `${property.addressLine1}${unit && !unit.isDefault ? `, Unit ${unit.name}` : ""}, ` +
        `${property.city}, ${property.state} ${property.zipCode}`;

    try {
        const email = workOrderEmail({
            organization: result.organization,
            title: workOrder.title,
            address,
            dueDate: workOrder.dueDate,
            notes: workOrder.notes,
            itemCount,
            url: `${getAppUrl()}/wo/${workOrder.publicToken}`,
            isResend: workOrder.deliveryMethod === "EMAIL",
        });

        await sendEmail({ to, ...email, replyTo: result.organization.email });
    } catch (error) {
        console.error("emailWorkOrder failed", error);
        return { ok: false, error: error instanceof Error ? error.message : "Email failed to send" };
    }

    // Only record the send once the email actually went out.
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

export async function regeneratePublicToken(workOrderId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, organizationId: result.organization.id },
    });

    if (!workOrder) throw new Error("Invalid work order");

    // The old link stops working as soon as the token changes.
    await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { publicToken: randomBytes(24).toString("base64url") },
    });

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/wo/${workOrder.publicToken}`);
}
