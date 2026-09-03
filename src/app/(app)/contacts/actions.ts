"use server";
import { ContactType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createContact(formData: FormData) {
    const result = await getCurrentUser();

    if (result.state !== "ready") {
        throw new Error("Not authorized");
    }

    const contactType = formData.get("contactType") as ContactType;
    const displayName = formData.get("displayName") as string;
    const firstName = (formData.get("firstName") as string) || null;
    const lastName = (formData.get("lastName") as string) || null;
    const company = (formData.get("company") as string) || null;
    const addressLine1 = (formData.get("addressLine1") as string) || null;
    const addressLine2 = (formData.get("addressLine2") as string) || null;
    const city = (formData.get("city") as string) || null;
    const zipCode = (formData.get("zipCode") as string) || null;
    const state = (formData.get("state") as string) || null;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = (formData.get("notes") as string) || null;
    const unitId = (formData.get("unitId") as string) || null;

    if (unitId) {
        const unit = await prisma.unit.findFirst({
            where: { id: unitId, organizationId: result.organization.id },
        });
        if (!unit) throw new Error("Invalid unit");
    }

    await prisma.contact.create({
        data: {
            organizationId: result.organization.id,
            contactType,
            displayName,
            firstName,
            lastName,
            company,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            email,
            phone,
            notes,
            unitId,
        },
    });
    revalidatePath("/contacts");
    redirect("/contacts");
}
