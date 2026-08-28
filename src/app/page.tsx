import prisma from "@/lib/prisma";

export default async function Home() {
    let count = 0;
    let error: string | null = null;

    try {
        count = await prisma.ping.count();
    } catch (e) {
        console.error(e);
        error = "Could not reach the database.";
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-bold">Work Order Generator</h1>
            {error ? <p className="text-red-500">{error}</p> : <p className="text-gray-500">{count} rows in Ping</p>}
        </main>
    );
}
