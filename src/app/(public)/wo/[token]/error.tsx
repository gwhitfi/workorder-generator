"use client";

import { useEffect } from "react";

export default function WorkOrderError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="mx-auto max-w-md px-4 py-24 text-center text-neutral-100">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-4 text-neutral-400">
                We couldn&apos;t load this work order. Try again in a moment. If it keeps happening, contact the
                office that sent it to you.
            </p>
            <button
                onClick={() => retry()}
                className="mt-8 rounded-md bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white"
            >
                Try again
            </button>
            {error.digest && <p className="mt-8 text-xs text-neutral-600">Error ID: {error.digest}</p>}
        </main>
    );
}
