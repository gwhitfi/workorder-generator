import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

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
        orderBy: { displayName: "asc" },
        include: {
            _count: {
                select: { units: true },
            },
        },
    });
    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Properties</h1>
                {properties.length === 0 && (
                    <div>
                        <h2>No properties added yet</h2>
                    </div>
                )}
                <Link
                    href="/properties/new"
                    className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Add Property
                </Link>
            </div>
            {properties.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800 text-left text-neutral-400">
                            <th className="px-3 pb-2 font-medium">Display Name</th>
                            <th className="px-3 pb-2 font-medium">Address</th>
                            <th className="px-3 pb-2 font-medium">Property Type</th>
                            <th className="px-3 pb-2 font-medium">Units</th>
                            <th className="px-3 pb-2 font-medium"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {properties.map((property) => (
                            <tr key={property.id} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                                <td className="px-3 py-3">{property.displayName}</td>
                                <td className="px-3 py-3 text-neutral-400">{property.addressLine1}</td>
                                <td className="px-3 py-3 text-neutral-400">{property.propertyType}</td>
                                <td className="px-3 py-3 text-neutral-400">
                                    {property._count.units > 1 ? property._count.units : ""}
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <Link
                                        href={`/properties/${property.id}`}
                                        className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-white"
                                    >
                                        View Detail
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}
