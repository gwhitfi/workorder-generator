"use server";
import { ContactType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OPEN_STATUSES } from "@/lib/workOrders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type ActionResult = { ok: true } | { ok: false; error: string };

async function readContactForm(formData: FormData, organizationId: string) {
    const contactType = formData.get("contactType") as ContactType;
    const unitId = contactType === "TENANT" ? (formData.get("unitId") as string) || null : null;

    if (unitId) {
        const unit = await prisma.unit.findFirst({
            where: { id: unitId, organizationId, archived: false, property: { archived: false } },
        });
        if (!unit) throw new Error("Invalid unit");
    }

    return {
        contactType,
        displayName: formData.get("displayName") as string,
        firstName: (formData.get("firstName") as string) || null,
        lastName: (formData.get("lastName") as string) || null,
        company: (formData.get("company") as string) || null,
        addressLine1: (formData.get("addressLine1") as string) || null,
        addressLine2: (formData.get("addressLine2") as string) || null,
        city: (formData.get("city") as string) || null,
        state: (formData.get("state") as string) || null,
        zipCode: (formData.get("zipCode") as string) || null,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        notes: (formData.get("notes") as string) || null,
        unitId,
    };
}

async function findContact(contactId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const contact = await prisma.contact.findFirst({
        where: { id: contactId, organizationId: result.organization.id },
    });
    if (!contact) throw new Error("Invalid contact");

    return contact;
}

function revalidateContact(contactId: string) {
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${contactId}`);
}

export async function createContact(formData: FormData) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const fields = await readContactForm(formData, result.organization.id);

    await prisma.contact.create({
        data: { organizationId: result.organization.id, ...fields },
    });
    revalidatePath("/contacts");
    redirect("/contacts");
}

export async function updateContact(contactId: string, formData: FormData) {
    const contact = await findContact(contactId);
    if (contact.archived) throw new Error("Restore this contact before editing it");

    const fields = await readContactForm(formData, contact.organizationId);

    if (fields.contactType !== contact.contactType && (await workOrderCount(contactId)) > 0) {
        throw new Error("This contact is on work orders, so its type can't change");
    }

    const snapshot = { name: fields.displayName, phone: fields.phone, email: fields.email };
    const openWorkOrders = { organizationId: contact.organizationId, archived: false, status: { in: OPEN_STATUSES } };

    await prisma.$transaction([
        prisma.contact.update({ where: { id: contactId }, data: fields }),
        prisma.workOrder.updateMany({
            where: { ...openWorkOrders, contractorId: contactId },
            data: {
                contractorName: snapshot.name,
                contractorPhone: snapshot.phone,
                contractorEmail: snapshot.email,
            },
        }),
        prisma.workOrder.updateMany({
            where: { ...openWorkOrders, tenantId: contactId },
            data: { tenantName: snapshot.name, tenantPhone: snapshot.phone, tenantEmail: snapshot.email },
        }),
    ]);

    revalidateContact(contactId);
    revalidatePath("/work-orders");
    redirect(`/contacts/${contactId}`);
}

function workOrderCount(contactId: string) {
    return prisma.workOrder.count({
        where: { OR: [{ contractorId: contactId }, { tenantId: contactId }] },
    });
}

export async function archiveContact(contactId: string): Promise<ActionResult> {
    const result = await getCurrentUser();
    if (result.state !== "ready") return { ok: false, error: "Not authorized" };

    const contact = await prisma.contact.findFirst({
        where: { id: contactId, organizationId: result.organization.id, archived: false },
    });
    if (!contact) return { ok: false, error: "Contact not found." };

    const openCount = await prisma.workOrder.count({
        where: { contractorId: contactId, archived: false, status: { in: OPEN_STATUSES } },
    });
    if (openCount > 0) {
        return {
            ok: false,
            error: `${contact.displayName} has ${openCount} open ${openCount === 1 ? "work order" : "work orders"}. Reassign, close or cancel ${openCount === 1 ? "it" : "them"} first.`,
        };
    }

    await prisma.contact.update({ where: { id: contactId }, data: { archived: true } });

    revalidateContact(contactId);
    if (contact.unitId) revalidatePath("/properties", "layout");
    return { ok: true };
}

export async function restoreContact(contactId: string) {
    const contact = await findContact(contactId);

    const unit = contact.unitId
        ? await prisma.unit.findFirst({
              where: { id: contact.unitId, archived: false, property: { archived: false } },
          })
        : null;

    await prisma.contact.update({
        where: { id: contactId },
        data: { archived: false, unitId: unit ? unit.id : null },
    });

    revalidateContact(contactId);
    if (unit) revalidatePath("/properties", "layout");
}

export async function toggleContactFavorite(contactId: string) {
    const contact = await findContact(contactId);

    await prisma.contact.update({ where: { id: contactId }, data: { favorite: !contact.favorite } });

    revalidateContact(contactId);
}
