import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import WorkOrderForm from "./WorkOrderForm";
import BackButton from "@/components/BackButton";
export default async function NewWorkOrder() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const properties = await prisma.property.findMany({
        where: { organizationId: result.organization.id, archived: false },
        orderBy: { displayName: "asc" },
        include: {
            units: {
                where: { archived: false },
                orderBy: { sortOrder: "asc" },
            },
        },
    });

    const contacts = await prisma.contact.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
            contactType: { in: ["CONTRACTOR", "OTHER"] },
        },
        orderBy: [{ favorite: "desc" }, { displayName: "asc" }],
    });

    const tenants = await prisma.contact.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
            contactType: "TENANT",
        },
    });

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <BackButton />
            <h1 className="text-2xl font-semibold mb-6">Create Work Order</h1>
            <WorkOrderForm properties={properties} contractors={contacts} tenants={tenants} />
            <Link href="/work-orders" className="text-sm text-neutral-400 hover:text-neutral-100">
                Cancel
            </Link>
        </main>
    );
}
