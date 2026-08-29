import { CreateOrganization } from "@clerk/nextjs";
import { mainModule } from "process";

export default function Page() {
    return (
        <main className="flex-min-h-screen items-center justify-center">
            <CreateOrganization />
        </main>
    );
}
