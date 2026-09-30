"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="mx-auto max-w-md px-4 py-24 text-center text-neutral-100">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-4 text-neutral-400">Try again, or go back to the dashboard.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
                <button
                    onClick={() => retry()}
                    className="rounded-md bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="rounded-md border border-neutral-700 px-6 py-3 text-sm font-medium hover:bg-neutral-900"
                >
                    Go to dashboard
                </Link>
            </div>
            {error.digest && <p className="mt-8 text-xs text-neutral-600">Error ID: {error.digest}</p>}
        </main>
    );
}
