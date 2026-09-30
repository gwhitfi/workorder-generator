import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertyForm from "../../new/PropertyForm";
import { updateProperty } from "../../actions";

export default async function EditProperty({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const property = await prisma.property.findFirst({
        where: { id, organizationId: result.organization.id },
    });

    if (!property) notFound();
    if (property.archived) redirect(`/properties/${id}`);

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <h1 className="text-2xl font-semibold mb-2">Edit Property</h1>
            <p className="mb-6 text-sm text-neutral-500">Units are managed on the property page.</p>
            <PropertyForm
                initial={{
                    displayName: property.displayName,
                    propertyType: property.propertyType,
                    addressLine1: property.addressLine1,
                    addressLine2: property.addressLine2 ?? "",
                    city: property.city,
                    state: property.state,
                    zipCode: property.zipCode,
                    notes: property.notes ?? "",
                }}
                action={updateProperty.bind(null, property.id)}
                submitLabel="Save changes"
            />
            <Link
                href={`/properties/${property.id}`}
                className="mt-4 inline-block text-sm text-neutral-400 hover:text-neutral-100"
            >
                Cancel
            </Link>
        </main>
    );
}
