import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ContactForm from "./ContactForm";
import prisma from "@/lib/prisma";

export default async function NewProperty() {
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
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <h1 className="text-2xl font-semibold mb-6">Add a new contact</h1>
            <ContactForm properties={properties} />
            <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                Cancel
            </Link>
        </main>
    );
}
