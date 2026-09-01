"use server";
import { PropertyType } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
