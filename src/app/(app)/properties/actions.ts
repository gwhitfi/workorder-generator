"use server";
import { PropertyType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { sendEmail } from "@/lib/email";
import { cancelledEmail } from "@/lib/emails/cancelledEmail";
import { formatWorkOrderAddress } from "@/lib/workOrders";

export async function createProperty(formData: FormData) {
    type UnitInput = { name: string; spaces: string[] };
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const displayName = formData.get("displayName") as string;
    const propertyType = formData.get("propertyType") as PropertyType;
    const addressLine1 = formData.get("addressLine1") as string;
    const addressLine2 = (formData.get("addressLine2") as string) || null;
    const city = formData.get("city") as string;
    const zipCode = formData.get("zipCode") as string;
    const state = formData.get("state") as string;
    const notes = (formData.get("notes") as string) || null;
    const spacesJson = formData.get("spaces") as string;
    const spaceNames: string[] = spacesJson ? JSON.parse(spacesJson) : [];
    const unitsJson = formData.get("units") as string;
    const units: UnitInput[] = unitsJson ? JSON.parse(unitsJson) : [];

    const unitsToCreate =
        units.length > 0
            ? units.map((u, i) => ({
                  name: u.name,
                  isDefault: false,
                  sortOrder: i,
                  organizationId: result.organization.id,
                  spaces: {
                      create: u.spaces.map((name, si) => ({
                          name,
                          sortOrder: si,
                          organizationId: result.organization.id,
                      })),
                  },
              }))
            : [
                  {
                      name: "Main",
                      isDefault: true,
                      sortOrder: 0,
                      organizationId: result.organization.id,
                      spaces: {
                          create: spaceNames.map((name, i) => ({
                              name,
                              sortOrder: i,
                              organizationId: result.organization.id,
                          })),
                      },
                  },
              ];

    await prisma.property.create({
        data: {
            organizationId: result.organization.id,
            displayName,
            propertyType,
            addressLine1,
            addressLine2,
            city,
            zipCode,
            state,
            notes,
            units: {
                create: unitsToCreate,
            },
        },
    });

    revalidatePath("/properties");
    redirect("/properties");
}

async function findProperty(propertyId: string) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const property = await prisma.property.findFirst({
        where: { id: propertyId, organizationId: result.organization.id },
    });
    if (!property) throw new Error("Invalid property");

    return { property, organization: result.organization };
}

export async function updateProperty(propertyId: string, formData: FormData) {
    const { property } = await findProperty(propertyId);
    if (property.archived) throw new Error("Archived properties can't be edited");

    await prisma.property.update({
        where: { id: propertyId },
        data: {
            displayName: formData.get("displayName") as string,
            propertyType: formData.get("propertyType") as PropertyType,
            addressLine1: formData.get("addressLine1") as string,
            addressLine2: (formData.get("addressLine2") as string) || null,
            city: formData.get("city") as string,
            state: formData.get("state") as string,
            zipCode: formData.get("zipCode") as string,
            notes: (formData.get("notes") as string) || null,
        },
    });

    revalidatePath("/properties");
    revalidatePath(`/properties/${propertyId}`);
    redirect(`/properties/${propertyId}`);
}

// Archiving a property ends all of its work: open work orders are cancelled, completed ones are closed,
// and everything is archived together in one transaction.
export async function archiveProperty(propertyId: string) {
    const { property, organization } = await findProperty(propertyId);

    const now = new Date();
    const onProperty = { propertyId, organizationId: organization.id };

    // Contractors who were sent a link get told it's cancelled. Drafts were never sent.
    const toNotify = await prisma.workOrder.findMany({
        where: { ...onProperty, archived: false, status: { in: ["SENT", "IN_PROGRESS"] } },
        include: { unit: true },
    });

    await prisma.$transaction([
        prisma.workOrder.updateMany({
            where: { ...onProperty, status: { in: ["DRAFT", "SENT", "IN_PROGRESS"] } },
            data: { status: "CANCELLED", cancelledAt: now, cancelReason: "Property archived", archived: true },
        }),
        prisma.workOrder.updateMany({
            where: { ...onProperty, status: "COMPLETED" },
            data: { status: "CLOSED", closedAt: now, archived: true },
        }),
        prisma.workOrder.updateMany({ where: onProperty, data: { archived: true } }),
        prisma.property.update({ where: { id: propertyId }, data: { archived: true } }),
    ]);

    after(async () => {
        for (const workOrder of toNotify) {
            if (!workOrder.contractorEmail) continue;
            try {
                const email = cancelledEmail({
                    organization,
                    title: workOrder.title,
                    address: formatWorkOrderAddress(property, workOrder.unit),
                });
                await sendEmail({ to: workOrder.contractorEmail, ...email, replyTo: organization.email });
            } catch (error) {
                console.error(`Cancellation notice failed for work order ${workOrder.id}`, error);
            }
        }
    });

    revalidatePath("/properties");
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath("/work-orders");
    revalidatePath("/");
    redirect("/properties");
}

// Only the property comes back; its work orders stay cancelled/archived and can be restored one by one.
export async function restoreProperty(propertyId: string) {
    await findProperty(propertyId);

    await prisma.property.update({ where: { id: propertyId }, data: { archived: false } });

    revalidatePath("/properties");
    revalidatePath(`/properties/${propertyId}`);
}

// --- Units and spaces -------------------------------------------------------------------------------
// These return a result instead of throwing so validation messages reach the page.

type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME_LENGTH = 100;

function cleanName(name: string) {
    return name.trim().slice(0, MAX_NAME_LENGTH);
}

async function currentOrgId() {
    const result = await getCurrentUser();
    return result.state === "ready" ? result.organization.id : null;
}

function isDuplicate(names: string[], name: string) {
    const lower = name.toLowerCase();
    return names.some((n) => n.toLowerCase() === lower);
}

function revalidateProperty(propertyId: string) {
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath("/properties");
}

export async function addUnit(propertyId: string, rawName: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Enter a unit name." };

    const property = await prisma.property.findFirst({
        where: { id: propertyId, organizationId: orgId, archived: false },
        include: { units: { where: { archived: false } } },
    });
    if (!property) return { ok: false, error: "Property not found." };
    if (
        isDuplicate(
            property.units.map((u) => u.name),
            name,
        )
    ) {
        return { ok: false, error: `${name} is already a unit here.` };
    }

    const last = await prisma.unit.aggregate({ where: { propertyId }, _max: { sortOrder: true } });
    await prisma.unit.create({
        data: { name, propertyId, organizationId: orgId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });

    revalidateProperty(propertyId);
    return { ok: true };
}

async function findOpenUnit(unitId: string, orgId: string) {
    return prisma.unit.findFirst({
        where: { id: unitId, organizationId: orgId, archived: false, property: { archived: false } },
    });
}

export async function renameUnit(unitId: string, rawName: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Enter a unit name." };

    const unit = await findOpenUnit(unitId, orgId);
    if (!unit) return { ok: false, error: "Unit not found." };

    const siblings = await prisma.unit.findMany({
        where: { propertyId: unit.propertyId, archived: false, NOT: { id: unitId } },
        select: { name: true },
    });
    if (
        isDuplicate(
            siblings.map((u) => u.name),
            name,
        )
    ) {
        return { ok: false, error: `${name} is already a unit here.` };
    }

    await prisma.unit.update({ where: { id: unitId }, data: { name } });

    revalidateProperty(unit.propertyId);
    return { ok: true };
}

// Blocked while the unit has open work orders or is the property's last unit.
// Tenants linked to the unit are unlinked but stay in Contacts.
export async function archiveUnit(unitId: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const unit = await findOpenUnit(unitId, orgId);
    if (!unit) return { ok: false, error: "Unit not found." };

    const [openCount, unitCount] = await Promise.all([
        prisma.workOrder.count({
            where: { unitId, archived: false, status: { in: ["DRAFT", "SENT", "IN_PROGRESS"] } },
        }),
        prisma.unit.count({ where: { propertyId: unit.propertyId, archived: false } }),
    ]);
    if (openCount > 0) {
        return { ok: false, error: "This unit has open work orders. Close or cancel them first." };
    }
    if (unitCount <= 1) return { ok: false, error: "A property needs at least one unit." };

    await prisma.$transaction([
        prisma.contact.updateMany({ where: { unitId, organizationId: orgId }, data: { unitId: null } }),
        prisma.unit.update({ where: { id: unitId }, data: { archived: true } }),
    ]);

    revalidateProperty(unit.propertyId);
    revalidatePath("/contacts");
    return { ok: true };
}

export async function addSpace(unitId: string, rawName: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Enter a space name." };

    const unit = await findOpenUnit(unitId, orgId);
    if (!unit) return { ok: false, error: "Unit not found." };

    const spaces = await prisma.space.findMany({ where: { unitId, archived: false }, select: { name: true } });
    if (
        isDuplicate(
            spaces.map((s) => s.name),
            name,
        )
    ) {
        return { ok: false, error: `${name} is already in this unit.` };
    }

    const last = await prisma.space.aggregate({ where: { unitId }, _max: { sortOrder: true } });
    await prisma.space.create({
        data: { name, unitId, organizationId: orgId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });

    revalidateProperty(unit.propertyId);
    return { ok: true };
}

async function findOpenSpace(spaceId: string, orgId: string) {
    return prisma.space.findFirst({
        where: {
            id: spaceId,
            organizationId: orgId,
            archived: false,
            // Only property spaces; the organization's common spaces (no unit) aren't managed here.
            unit: { archived: false, property: { archived: false } },
        },
        include: { unit: { select: { propertyId: true } } },
    });
}

export async function renameSpace(spaceId: string, rawName: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Enter a space name." };

    const space = await findOpenSpace(spaceId, orgId);
    if (!space?.unit) return { ok: false, error: "Space not found." };

    const siblings = await prisma.space.findMany({
        where: { unitId: space.unitId, archived: false, NOT: { id: spaceId } },
        select: { name: true },
    });
    if (
        isDuplicate(
            siblings.map((s) => s.name),
            name,
        )
    ) {
        return { ok: false, error: `${name} is already in this unit.` };
    }

    await prisma.space.update({ where: { id: spaceId }, data: { name } });

    revalidateProperty(space.unit.propertyId);
    return { ok: true };
}

// Past work orders keep their own copy of the space name, so archiving only removes it from future pickers.
export async function archiveSpace(spaceId: string): Promise<ActionResult> {
    const orgId = await currentOrgId();
    if (!orgId) return { ok: false, error: "Not authorized" };

    const space = await findOpenSpace(spaceId, orgId);
    if (!space?.unit) return { ok: false, error: "Space not found." };

    await prisma.space.update({ where: { id: spaceId }, data: { archived: true } });

    revalidateProperty(space.unit.propertyId);
    return { ok: true };
}
