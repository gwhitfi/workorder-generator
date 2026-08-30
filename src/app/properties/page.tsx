import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
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
    });
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-2">
            <UserButton />
            <h1 className="text-4xl font-bold">{`${result.organization.name}'s Properties`}</h1>
            {properties.length === 0 && (
                <div>
                    <h2>No properties added yet</h2>
                </div>
            )}
            <Link href="/properties/new">Add Property</Link>
            {properties.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Display Name</th>
                            <th>Address</th>
                            <th>Property Type</th>
                        </tr>
                    </thead>

                    <tbody>
                        {properties.map((property) => (
                            <tr key={property.id}>
                                <td>{property.displayName}</td>
                                <td>{property.addressLine1}</td>
                                <td>{property.propertyType}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <p className="text-gray-500">{result.user.email}</p>
        </main>
    );
}
