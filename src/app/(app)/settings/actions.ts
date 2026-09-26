"use server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganizationContact(formData: FormData) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const phone = ((formData.get("phone") as string) ?? "").trim() || null;
    const email = ((formData.get("email") as string) ?? "").trim() || null;

    await prisma.organization.update({
        where: { id: result.organization.id },
        data: { phone, email },
    });

    revalidatePath("/settings");
    // Public work order pages read these live, so refresh them too.
    revalidatePath("/wo/[token]", "page");
}
