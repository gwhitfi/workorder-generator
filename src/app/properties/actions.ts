"use server";
import { PropertyType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProperty(formData: FormData) {
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
        },
    });

    revalidatePath("/properties");
    redirect("/properties");
}
