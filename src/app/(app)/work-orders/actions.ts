"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
