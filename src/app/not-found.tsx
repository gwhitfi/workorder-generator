import Link from "next/link";

export default function NotFound() {
    return (
        <main className="mx-auto max-w-md px-4 py-24 text-center text-foreground">
            <p className="text-sm font-medium text-subtle">404</p>
            <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
            <p className="mt-4 text-muted">This page doesn&apos;t exist, or it may have been deleted or archived.</p>
            <Link
                href="/"
                className="mt-8 inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
                Go to dashboard
            </Link>
        </main>
    );
}
