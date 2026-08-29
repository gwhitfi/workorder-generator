import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import type { User, Organization } from "@/generated/prisma/client";
import { DEFAULT_AREAS, DEFAULT_ROOMS, DEFAULT_TAGS } from "./defaults";
import prisma from "./prisma";

type AuthResult =
    | { state: "signed-out" }
    | { state: "needs-org"; clerkUserId: string }
    | { state: "ready"; user: User; organization: Organization };

export async function getCurrentUser(): Promise<AuthResult> {
    const { userId, orgId } = await auth();
    if (!userId) {
        return { state: "signed-out" };
    }
    if (!orgId) {
        return { state: "needs-org", clerkUserId: userId };
    }

    let organization = await prisma.organization.findUnique({
        where: { clerkOrgId: orgId },
    });

    if (!organization) {
        const client = await clerkClient();
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
        organization = await prisma.organization.create({
            data: { clerkOrgId: orgId, name: clerkOrg.name },
        });
        const org = organization;

        await prisma.areaPreset.createMany({
            data: DEFAULT_AREAS.map((name, i) => ({
                name,
                sortOrder: i,
                organizationId: org.id,
            })),
        });

        await prisma.roomPreset.createMany({
            data: DEFAULT_ROOMS.map((name, i) => ({
                name,
                sortOrder: i,
                organizationId: org.id,
            })),
        });

        await prisma.tag.createMany({
            data: DEFAULT_TAGS.map((name, i) => ({
                name,
                sortOrder: i,
                organizationId: org.id,
            })),
        });
    }

    let user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!user) {
        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses[0]?.emailAddress;
        if (!email) {
            throw new Error("Clerk user has no email address");
        }

        user = await prisma.user.create({
            data: {
                clerkId: userId,
                email,
                firstName: clerkUser?.firstName ?? null,
                lastName: clerkUser?.lastName ?? null,
                organizationId: organization.id,
            },
        });
    }
    return { state: "ready", user, organization };
}
