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
                <h2 className="text-lg font-semibold text-neutral-100">Organization</h2>
                <p className="mt-1 mb-4 text-sm text-neutral-500">
                    Your name, phone and email are shown to contractors on the work orders and emails you send them.
                </p>
                <OrganizationContactForm
                    name={organization.name}
                    phone={organization.phone}
                    email={organization.email}
                />
            </section>
        </main>
    );
}
