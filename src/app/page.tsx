import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "./Dashboard";
import Landing from "./Landing";

export default async function Home() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        return <Landing />;
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    return <Dashboard user={result.user} organization={result.organization} />;
}
