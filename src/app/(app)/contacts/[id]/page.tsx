import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TYPE_LABELS } from "@/lib/defaults";
import prisma from "@/lib/prisma";
import { OPEN_STATUSES } from "@/lib/workOrders";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Favorite } from "@/components/list/List";
import FavoriteToggle from "@/components/FavoriteToggle";
import { toggleContactFavorite } from "../actions";
import { ArchiveContactButton, RestoreContactButton } from "./ArchiveContact";

export default async function ContactDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const organizationId = result.organization.id;

    const [contact, openCount] = await Promise.all([
        prisma.contact.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                unit: {
                    include: { property: true },
                },
            },
        }),

        prisma.workOrder.count({
            where: { organizationId, contractorId: id, archived: false, status: { in: OPEN_STATUSES } },
        }),
    ]);
    if (!contact) {
        notFound();
    }
    return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-100">
            {contact.archived && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3">
                    <p className="text-sm text-neutral-300">This contact is archived.</p>
                    <RestoreContactButton contactId={contact.id} />
                </div>
            )}
            <div className="mb-8">
                <p className="text-sm text-neutral-500 mb-1">{CONTACT_TYPE_LABELS[contact.contactType]}</p>
                <div className="mb-2 flex items-start justify-between gap-4">
                    <h1 className="text-2xl font-semibold">
                        {contact.displayName}
                        {contact.archived ? (
                            <Favorite show={contact.favorite} />
                        ) : (
                            <FavoriteToggle
                                favorite={contact.favorite}
                                onToggle={toggleContactFavorite.bind(null, contact.id)}
                            />
                        )}
                    </h1>
                    {!contact.archived && (
                        <Link
                            href={`/contacts/${contact.id}/edit`}
                            className="mt-1 shrink-0 text-sm text-neutral-400 hover:text-neutral-100"
                        >
                            Edit
                        </Link>
                    )}
                </div>

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
                            {contact.unit.property.displayName}
                            {!contact.unit.isDefault && ` · Unit ${contact.unit.name}`}
                        </Link>
                    )}
                    {!contact.unit && contact.contactType === "TENANT" && (
                        <p className="mt-8 text-neutral-500">Not linked to a property.</p>
                    )}
                </div>
                {contact.notes && <p className="mt-4 whitespace-pre-line text-sm text-neutral-400">{contact.notes}</p>}
            </div>

            {!contact.archived && (
                <div className="mt-8 flex justify-end border-t border-neutral-800 pt-6">
                    <ArchiveContactButton
                        contactId={contact.id}
                        contactName={contact.displayName}
                        openCount={openCount}
                        isTenant={contact.contactType === "TENANT"}
                    />
                </div>
            )}
        </main>
    );
}
