import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { MULTI_UNIT, PROPERTY_TYPE_LABELS } from "@/lib/defaults";

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }
    const property = await prisma.property.findFirst({
        where: {
            id,
            organizationId: result.organization.id,
        },
        include: {
            units: {
                where: { archived: false },
                orderBy: { sortOrder: "asc" },
                include: {
                    spaces: {
                        where: { archived: false },
                        orderBy: { sortOrder: "asc" },
                    },
                },
            },
        },
    });
    if (!property) {
        notFound();
    }
    const isMultiUnitType = MULTI_UNIT.includes(property.propertyType);
    const isSingleUnit = !isMultiUnitType && property.units.length === 1 && property.units[0].isDefault;

    return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-100">
            <div className="mb-8">
                <p className="text-sm text-neutral-500 mb-1">{PROPERTY_TYPE_LABELS[property.propertyType]}</p>
                <h1 className="text-2xl font-semibold mb-2">{property.displayName}</h1>

                <div className="text-sm text-neutral-400 leading-relaxed">
                    <p>{property.addressLine1}</p>
                    {property.addressLine2 && <p>{property.addressLine2}</p>}
                    <p>
                        {property.city}, {property.state} {property.zipCode}
                    </p>
                </div>
                {property.notes && <p className="mt-4 text-sm text-neutral-400">{property.notes}</p>}
            </div>
            <div className="border-t border-neutral-800 pt-6">
                <h2 className="text-lg font-semibold mb-3">{isSingleUnit ? "Spaces" : "Units"}</h2>

                {property.units.length === 0 && (
                    <p className="text-sm text-neutral-500">No units yet. Add one to start tracking spaces.</p>
                )}

                {isSingleUnit && <SpaceList spaces={property.units[0].spaces} />}

                {!isSingleUnit &&
                    property.units.map((unit) => (
                        <div key={unit.id} className="mb-6">
                            <h3 className="text-sm font-medium text-neutral-300 mb-2">{unit.name}</h3>
                            <SpaceList spaces={unit.spaces} />
                        </div>
                    ))}
            </div>

            <Link href="/properties" className="mt-8 inline-block text-sm text-neutral-400 hover:text-neutral-100">
                Return
            </Link>
        </main>
    );
}

function SpaceList({ spaces }: { spaces: { id: string; name: string }[] }) {
    if (spaces.length === 0) {
        return <p className="text-sm text-neutral-500">No spaces added.</p>;
    }

    return (
        <ul className="flex flex-col gap-1">
            {spaces.map((space) => (
                <li key={space.id} className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm">
                    {space.name}
                </li>
            ))}
        </ul>
    );
}
