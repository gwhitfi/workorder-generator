import { getCurrentUser } from "@/lib/auth";
import { CONTACT_TYPE_LABELS } from "@/lib/defaults";
import prisma from "@/lib/prisma";
import { OPEN_STATUSES } from "@/lib/workOrders";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InfoCard from "@/components/InfoCard";
import { Favorite } from "@/components/list/List";
import FavoriteToggle from "@/components/FavoriteToggle";
import { WorkOrderList } from "@/components/WorkOrderRow";
import DeleteButton from "@/components/DeleteButton";
import { deleteContact, toggleContactFavorite } from "../actions";
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

    const contact = await prisma.contact.findFirst({
        where: {
            id,
            organizationId,
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

    const isTenant = contact.contactType === "TENANT";
    const workOrderWhere = { organizationId, archived: false, ...(isTenant ? { tenantId: id } : { contractorId: id }) };

    const [workOrders, workOrderCount, openCount] = await Promise.all([
        prisma.workOrder.findMany({
            where: workOrderWhere,
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { property: true, unit: true },
        }),
        prisma.workOrder.count({ where: workOrderWhere }),
        prisma.workOrder.count({ where: { ...workOrderWhere, status: { in: OPEN_STATUSES } } }),
    ]);

    // Open work first, newest first within each group.
    const isOpen = (status: (typeof workOrders)[number]["status"]) => OPEN_STATUSES.includes(status);
    const shownWorkOrders = [
        ...workOrders.filter((wo) => isOpen(wo.status)),
        ...workOrders.filter((wo) => !isOpen(wo.status)),
    ].slice(0, 10);

    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
    const contactTitle = fullName || contact.company || contact.displayName;
    const property = contact.unit?.property;

    return (
        <main className="mx-auto max-w-3xl px-4 py-10 text-neutral-100">
            {contact.archived && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3">
                    <p className="text-sm text-neutral-300">This contact is archived.</p>
                    <RestoreContactButton contactId={contact.id} />
                </div>
            )}
            <div className="mb-8">
                <span className="mb-2 inline-block rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                    {CONTACT_TYPE_LABELS[contact.contactType]}
                </span>
                <div className="mb-4 flex items-start justify-between gap-4">
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

                <div className="grid gap-4 sm:grid-cols-3">
                    <InfoCard label="Contact" title={contactTitle}>
                        {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="block truncate hover:text-neutral-100">
                                {contact.phone}
                            </a>
                        ) : (
                            <p className="text-neutral-500">No phone</p>
                        )}
                        {contact.email ? (
                            <a href={`mailto:${contact.email}`} className="block truncate hover:text-neutral-100">
                                {contact.email}
                            </a>
                        ) : (
                            <p className="text-neutral-500">No email</p>
                        )}
                    </InfoCard>

                    {isTenant ? (
                        <InfoCard
                            label="Property"
                            title={property ? property.displayName : "Not linked to a property"}
                            href={property ? `/properties/${property.id}` : undefined}
                        >
                            {contact.unit && !contact.unit.isDefault && <p>Unit {contact.unit.name}</p>}
                        </InfoCard>
                    ) : (
                        <InfoCard label="Address" title={contact.addressLine1 ?? "No address on file"}>
                            {contact.addressLine2 && <p>{contact.addressLine2}</p>}
                            {contact.city && (
                                <p>
                                    {contact.city}, {contact.state} {contact.zipCode}
                                </p>
                            )}
                            {contact.company && contact.company !== contactTitle && <p>{contact.company}</p>}
                        </InfoCard>
                    )}

                    <InfoCard label="Work orders" title={`${openCount} open`}>
                        <p>{workOrderCount} total</p>
                    </InfoCard>
                </div>
            </div>

            {contact.notes && (
                <div className="mb-8 text-sm leading-relaxed text-neutral-400">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Notes</p>
                    <p className="mt-1 whitespace-pre-line">{contact.notes}</p>
                </div>
            )}

            <section className="border-t border-neutral-800 pt-6">
                <div className="mb-3 flex items-baseline justify-between gap-4">
                    <h2 className="text-lg font-semibold">Work orders</h2>
                    {!contact.archived && isTenant && property && !property.archived && (
                        <Link
                            href={`/work-orders/new?propertyId=${property.id}`}
                            className="shrink-0 text-sm text-neutral-400 hover:text-neutral-100"
                        >
                            + Create work order
                        </Link>
                    )}
                </div>
                {shownWorkOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-neutral-800 px-4 py-4 text-sm text-neutral-500">
                        No work orders for this contact yet.
                    </p>
                ) : (
                    <WorkOrderList workOrders={shownWorkOrders} hideContractor={!isTenant} />
                )}
            </section>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-2 border-t border-neutral-800 pt-6">
                {(isTenant || openCount === 0) && (
                    <DeleteButton itemName={contact.displayName} onDelete={deleteContact.bind(null, contact.id)}>
                        <p>
                            Their work orders stay, keeping the name, phone and email saved on them, but will no longer
                            link to this contact.
                        </p>
                        {!contact.archived && (
                            <p className="text-neutral-400">
                                To keep them in your records, go back and use <strong>Archive contact</strong> instead.
                            </p>
                        )}
                    </DeleteButton>
                )}
                {!contact.archived && (
                    <ArchiveContactButton
                        contactId={contact.id}
                        contactName={contact.displayName}
                        openCount={isTenant ? 0 : openCount}
                        isTenant={isTenant}
                    />
                )}
            </div>
        </main>
    );
}
