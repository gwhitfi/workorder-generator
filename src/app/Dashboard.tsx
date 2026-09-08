import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Organization } from "@/generated/prisma/client";
import Nav from "@/components/Nav";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";

export default async function Dashboard({ organization }: { organization: Organization }) {
    const propertyCount = await prisma.property.count({
        where: { organizationId: organization.id, archived: false },
    });

    const contactCount = await prisma.contact.count({
        where: { organizationId: organization.id, archived: false },
    });

    const workOrderCount = await prisma.workOrder.count({
        where: { organizationId: organization.id, archived: false },
    });

    const recentWorkOrders = await prisma.workOrder.findMany({
        where: { organizationId: organization.id, archived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const recentProperties = await prisma.property.findMany({
        where: { organizationId: organization.id, archived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            _count: {
                select: {
                    workOrders: {
                        where: {
                            archived: false,
                            status: { in: ["DRAFT", "SENT", "IN_PROGRESS"] },
                        },
                    },
                },
            },
        },
    });

    return (
        <div className="text-neutral-100">
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-10">
                <div className="mb-8">
                    <p className="text-lg font-semibold">{organization.name}</p>
                </div>
                <div className="mb-10 grid gap-4 sm:grid-cols-3">
                    <StatCard label="Properties" value={propertyCount} href="/properties" />
                    <StatCard label="Contacts" value={contactCount} href="/contacts" />
                    <StatCard label="Work Orders" value={workOrderCount} href="/work-orders" />
                </div>
                <div className="mb-10 flex flex-wrap justify-around gap-3">
                    <Link
                        href="/properties/new"
                        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Add property
                    </Link>
                    <Link
                        href="/contacts/new"
                        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Add contact
                    </Link>
                    <Link
                        href="/work-orders/new"
                        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Create work order
                    </Link>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                    <section className="border-t border-neutral-800 pt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Recent properties</h2>
                            <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                                View all
                            </Link>
                        </div>
                        {recentProperties.length === 0 ? (
                            <p className="text-sm text-neutral-500">No properties yet.</p>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {recentProperties.map((property) => (
                                    <li key={property.id}>
                                        <Link
                                            href={`/properties/${property.id}`}
                                            className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
                                        >
                                            <span className="truncate text-sm">{property.displayName}</span>
                                            {property._count.workOrders > 0 && (
                                                <span className="shrink-0 rounded-full border border-amber-700 px-2 py-0.5 text-xs text-amber-400">
                                                    {property._count.workOrders} open
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    <section className="border-t border-neutral-800 pt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Recent Work Orders</h2>
                            <Link href="/work-orders" className="text-sm text-neutral-400 hover:text-neutral-100">
                                View all
                            </Link>
                        </div>
                        {recentWorkOrders.length === 0 ? (
                            <p className="text-sm text-neutral-500">No work orders yet.</p>
                        ) : (
                            <ul className="flex flex-col gap-1">
                                {recentWorkOrders.map((workOrder) => (
                                    <li key={workOrder.id}>
                                        <Link
                                            href={`/work-orders/${workOrder.id}`}
                                            className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
                                        >
                                            <span className="truncate text-sm">
                                                {workOrder.title ?? "Untitled work order"}
                                            </span>
                                            <span className="shrink-0 rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                                                {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
    return (
        <Link href={href} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
            <p className="text-sm text-neutral-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </Link>
    );
}
