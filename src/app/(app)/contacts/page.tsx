import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Contacts() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const contacts = await prisma.contact.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
        },
        orderBy: [{ favorite: "desc" }, { displayName: "asc" }],
        include: {
            unit: {
                include: { property: true },
            },
        },
    });

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Contacts</h1>
                {contacts.length === 0 && (
                    <div>
                        <h2>No contacts added yet</h2>
                    </div>
                )}
                <Link
                    href="/contacts/new"
                    className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Add Contact
                </Link>
            </div>
            {contacts.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800 text-left text-neutral-400">
                            <th className="px-3 pb-2 font-medium">Display Name</th>
                            <th className="px-3 pb-2 font-medium">Contact Name</th>
                            <th className="px-3 pb-2 font-medium">Property Type</th>
                            <th className="px-3 pb-2 font-medium">Units</th>
                            <th className="px-3 pb-2 font-medium"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                                <td className="px-3 py-3">{contact.displayName}</td>
                                <td className="px-3 py-3 text-neutral-400"></td>
                                <td className="px-3 py-3 text-neutral-400"></td>

                                <td className="px-3 py-3 text-right">
                                    <Link
                                        href={`/properties/${contact.id}`}
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
            <p className="text-gray-500">{result.user.email}</p>
        </main>
    );
}
