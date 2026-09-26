import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PROPERTY_TYPE_LABELS } from "@/lib/defaults";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { List, ListHeader, ListRow, Cell, Favorite } from "@/components/list/List";

const COLS = "sm:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]";

export default async function Properties() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const properties = await prisma.property.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
        },
        orderBy: [{ favorite: "desc" }, { displayName: "asc" }],
        include: {
            _count: {
                select: {
                    units: { where: { archived: false } },
                    workOrders: {
                        where: { archived: false, status: { in: ["DRAFT", "SENT", "IN_PROGRESS"] } },
                    },
                },
            },
        },
    });

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <PageHeader
                title="Properties"
                subtitle={`${properties.length} ${properties.length === 1 ? "property" : "properties"}`}
                actionHref="/properties/new"
                actionLabel="Add Property"
            />

            {properties.length === 0 ? (
                <EmptyState
                    message="No properties added yet."
                    actionHref="/properties/new"
                    actionLabel="Add your first property"
                />
            ) : (
                <List>
                    <ListHeader cols={COLS} labels={["Name", "Address", "Type", "Units", "Open work"]} />
                    {properties.map((property) => (
                        <ListRow
                            key={property.id}
                            href={`/properties/${property.id}`}
                            label={`View ${property.displayName}`}
                            cols={COLS}
                        >
                            <Cell className="basis-full truncate font-medium text-neutral-100">
                                {property.displayName}
                                <Favorite show={property.favorite} />
                            </Cell>
                            <Cell className="basis-full text-neutral-400">
                                <p className="truncate">{property.addressLine1}</p>
                                <p className="truncate text-xs text-neutral-500">
                                    {property.city}, {property.state} {property.zipCode}
                                </p>
                            </Cell>
                            <Cell className="text-neutral-400">{PROPERTY_TYPE_LABELS[property.propertyType]}</Cell>
                            <Cell className="text-neutral-400">
                                {property._count.units > 1 && `${property._count.units} units`}
                            </Cell>
                            <Cell>
                                {property._count.workOrders > 0 && (
                                    <span className="rounded-full border border-amber-700 px-2 py-0.5 text-xs text-amber-400">
                                        {property._count.workOrders} open
                                    </span>
                                )}
                            </Cell>
                        </ListRow>
                    ))}
                </List>
            )}
        </main>
    );
}
