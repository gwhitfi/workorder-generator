"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="mx-auto max-w-md px-4 py-24 text-center text-foreground">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-4 text-muted">Try again, or go back to the dashboard.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
                <button
                    onClick={() => retry()}
                    className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-on-accent hover:bg-accent-hover"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="rounded-md border border-line-strong px-6 py-3 text-sm font-medium hover:bg-surface"
                >
                    Go to dashboard
                </Link>
            </div>
            {error.digest && <p className="mt-8 text-xs text-faint">Error ID: {error.digest}</p>}
        </main>
    );
}
