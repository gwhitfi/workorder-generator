import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TYPE_LABELS } from "@/lib/defaults";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const contact = await prisma.contact.findFirst({
        where: {
            id,
            organizationId: result.organization.id,
        },
        include: {
            unit: {
                include: { property: true },
            },
        },
    });
    if (!contact) {
        notFound();
    }
    return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-100">
            <div className="mb-8">
                <p className="text-sm text-neutral-500 mb-1">{CONTACT_TYPE_LABELS[contact.contactType]}</p>
                <h1 className="text-2xl font-semibold mb-2">{contact.displayName}</h1>

                <div className="text-sm text-neutral-400 leading-relaxed">
                    <p>{contact.email}</p>
                    <p>{contact.phone}</p>
                    {contact.addressLine1 && <p>{contact.addressLine1}</p>}
                    {contact.addressLine2 && <p>{contact.addressLine2}</p>}
                    {contact.city && (
                        <p>
                            {contact.city}, {contact.state} {contact.zipCode}
                        </p>
                    )}
                    {contact.unit && (
                        <Link
                            href={`/properties/${contact.unit.propertyId}`}
                            className="mt-8 inline-block text-sm text-neutral-400 hover:text-neutral-100"
                        >
                            {contact.unit.property.displayName} — {contact.unit.name}
                        </Link>
                    )}
                </div>
                {contact.notes && <p className="mt-4 text-sm text-neutral-400">{contact.notes}</p>}
            </div>

            <Link href="/contacts" className="mt-8 inline-block text-sm text-neutral-400 hover:text-neutral-100">
                Return
            </Link>
        </main>
    );
}
