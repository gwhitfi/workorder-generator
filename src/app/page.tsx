import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-2">
            <UserButton />
            <h1 className="text-4xl font-bold">Work Order Generator</h1>
            <p className="text-gray-500">{result.organization.name}</p>
            <p className="text-gray-500">{result.user.email}</p>
        </main>
    );
}
