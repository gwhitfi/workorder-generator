import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { List, ListHeader, ListRow, Cell, ListLink, Favorite } from "@/components/list/List";

const COLS = "sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.5fr)]";

export default async function Contacts({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const showArchived = (await searchParams).archived === "1";

    const contacts = await prisma.contact.findMany({
        where: {
            organizationId: result.organization.id,
            archived: showArchived,
        },
        orderBy: [{ favorite: "desc" }, { displayName: "asc" }],
        include: {
            unit: {
                include: { property: true },
            },
        },
    });

    type ContactRow = (typeof contacts)[number];

    const sections: {
        type: ContactRow["contactType"];
        title: string;
        empty: string;
        detailLabel: string;
        detail: (c: ContactRow) => ReactNode;
    }[] = [
        {
            type: "CONTRACTOR",
            title: "Contractors",
            empty: "No contractors yet.",
            detailLabel: "Company",
            detail: (c) => c.company,
        },
        {
            type: "TENANT",
            title: "Tenants",
            empty: "No tenants yet.",
            detailLabel: "Property",
            detail: (c) =>
                c.unit && `${c.unit.property.displayName}${c.unit.isDefault ? "" : ` · Unit ${c.unit.name}`}`,
        },
        {
            type: "OTHER",
            title: "Other",
            empty: "No other contacts yet.",
            detailLabel: "Notes",
            detail: (c) => c.notes,
        },
    ];

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <PageHeader
                title="Contacts"
                subtitle={`${contacts.length} ${showArchived ? "archived " : ""}${contacts.length === 1 ? "contact" : "contacts"}`}
                actionHref="/contacts/new"
                actionLabel="Add Contact"
            />

            <div className="-mt-4 mb-4 flex justify-end">
                <Link
                    href={showArchived ? "/contacts" : "/contacts?archived=1"}
                    className="text-sm text-neutral-500 hover:text-neutral-100"
                >
                    {showArchived ? "← Show active" : "Show archived"}
                </Link>
            </div>

            {contacts.length === 0 && showArchived ? (
                <p className="rounded-lg border border-dashed border-neutral-800 px-4 py-4 text-sm text-neutral-500">
                    No archived contacts.
                </p>
            ) : contacts.length === 0 ? (
                <EmptyState
                    message="No contacts added yet."
                    actionHref="/contacts/new"
                    actionLabel="Add your first contact"
                />
            ) : (
                <div className="flex flex-col gap-8">
                    {sections.map((section) => {
                        const rows = contacts.filter((c) => c.contactType === section.type);

                        return (
                            <section key={section.type}>
                                <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
                                    {section.title}
                                    <span className="text-sm font-normal text-neutral-500">{rows.length}</span>
                                </h2>

                                {rows.length === 0 ? (
                                    <p className="rounded-lg border border-dashed border-neutral-800 px-4 py-4 text-sm text-neutral-500">
                                        {section.empty}
                                    </p>
                                ) : (
                                    <List>
                                        <ListHeader
                                            cols={COLS}
                                            labels={["Name", section.detailLabel, "Phone", "Email"]}
                                        />
                                        {rows.map((contact) => (
                                            <ListRow
                                                key={contact.id}
                                                href={`/contacts/${contact.id}`}
                                                label={`View ${contact.displayName}`}
                                                cols={COLS}
                                            >
                                                <Cell className="basis-full truncate font-medium text-neutral-100">
                                                    {contact.displayName}
                                                    <Favorite show={contact.favorite} />
                                                </Cell>
                                                <Cell className="basis-full truncate text-neutral-400">
                                                    {section.detail(contact)}
                                                </Cell>
                                                <Cell className="text-neutral-400">
                                                    {contact.phone && (
                                                        <ListLink href={`tel:${contact.phone}`}>
                                                            {contact.phone}
                                                        </ListLink>
                                                    )}
                                                </Cell>
                                                <Cell className="text-neutral-400">
                                                    {contact.email && (
                                                        <ListLink href={`mailto:${contact.email}`}>
                                                            {contact.email}
                                                        </ListLink>
                                                    )}
                                                </Cell>
                                            </ListRow>
                                        ))}
                                    </List>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
