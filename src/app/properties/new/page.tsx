import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PropertyForm from "./PropertyForm";

export default async function NewProperty() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }
    return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-100">
            <h1 className="text-2xl font-semibold mb-6">Add a property</h1>
            <PropertyForm />
            <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                Cancel
            </Link>
        </main>
    );
}
