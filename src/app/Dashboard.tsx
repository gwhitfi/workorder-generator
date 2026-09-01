import Link from "next/link";
import prisma from "@/lib/prisma";
import type { User, Organization } from "@/generated/prisma/client";
import Nav from "@/components/Nav";

export default async function Dashboard({ organization }: { user: User; organization: Organization }) {
    const propertyCount = await prisma.property.count({
        where: { organizationId: organization.id, archived: false },
    });

    const recentProperties = await prisma.property.findMany({
        where: { organizationId: organization.id, archived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    return (
        <div className="text-neutral-100">
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-10">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold"></h1>
                    <p className="mt-1 text-sm text-neutral-500">{organization.name}</p>
                </div>

                <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Properties" value={propertyCount} href="/properties" />
                </div>

                <div className="mb-10 flex flex-wrap gap-3">
                    <Link
                        href="/properties/new"
                        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Add property
                    </Link>
                </div>

                <section className="border-t border-neutral-800 pt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent properties</h2>
                        <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                            View all
                        </Link>
                    </div>

                    {recentProperties.length === 0 ? (
                        <p className="text-sm text-neutral-500">{/* Empty state: what to do first */}</p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {recentProperties.map((property) => (
                                <li key={property.id}>
                                    <Link
                                        href={`/properties/${property.id}`}
                                        className="block rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-neutral-700"
                                    >
                                        <span className="text-sm">{property.displayName}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
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
