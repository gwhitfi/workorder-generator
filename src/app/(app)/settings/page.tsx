import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizationContactForm from "./OrganizationContactForm";

export default async function Settings() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const { organization } = result;

    return (
        <main className="mx-auto max-w-3xl px-4 py-10 text-neutral-100">
            <h1 className="mb-8 text-2xl font-semibold">Settings</h1>

            <section>
                <h2 className="text-lg font-semibold text-neutral-100">Office contact</h2>
                <p className="mt-1 mb-4 text-sm text-neutral-500">
                    Shown to contractors on the work orders you send them so they can reach {organization.name}.
                </p>
                <OrganizationContactForm phone={organization.phone} email={organization.email} />
            </section>
        </main>
    );
}
