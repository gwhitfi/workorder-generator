import Nav from "@/components/Nav";
import Link from "next/link";

export default function Landing() {
    return (
        <main className="text-neutral-100">
            <Nav />
            <section className="mx-auto max-w-3xl px-4 py-24 text-center">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl"></h1>
                <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400"></p>
                <div className="mt-10 flex items-center justify-center gap-4">
                    <Link
                        href="/sign-up"
                        className="rounded-md bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Get started
                    </Link>
                    <Link
                        href="/sign-in"
                        className="rounded-md border border-neutral-700 px-6 py-3 text-sm font-medium hover:bg-neutral-900"
                    >
                        Sign in
                    </Link>
                </div>
            </section>

            <section className="mx-auto max-w-5xl border-t border-neutral-800 px-4 py-20">
                <div className="grid gap-10 sm:grid-cols-3">
                    <div>
                        <h3 className="text-base font-medium">{/* Feature name */}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-400">{/* Two sentences */}</p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-3xl border-t border-neutral-800 px-4 py-20 text-center">
                <h2 className="text-2xl font-semibold">{/* Restate the offer */}</h2>
                <Link
                    href="/sign-up"
                    className="mt-8 inline-block rounded-md bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Get started
                </Link>
            </section>

            <footer className="mx-auto max-w-5xl border-t border-neutral-800 px-4 py-8 text-sm text-neutral-500">
                <p>
                    &copy; {new Date().getFullYear()} {/* Company name */}
                </p>
            </footer>
        </main>
    );
}
