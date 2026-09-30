"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrganization(formData: FormData) {
    const result = await getCurrentUser();
    if (result.state !== "ready") throw new Error("Not authorized");

    const name = ((formData.get("name") as string) ?? "").trim();
    const phone = ((formData.get("phone") as string) ?? "").trim() || null;
    const email = ((formData.get("email") as string) ?? "").trim() || null;
    if (!name) throw new Error("Organization name is required");

    if (name !== result.organization.name) {
        const client = await clerkClient();
        await client.organizations.updateOrganization(result.organization.clerkOrgId, { name });
    }

    await prisma.organization.update({
        where: { id: result.organization.id },
        data: { name, phone, email },
    });

    revalidatePath("/", "layout");
}
