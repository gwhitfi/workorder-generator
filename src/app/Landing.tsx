import Link from "next/link";

const FEATURES = [
    {
        title: "One link for your contractor",
        body: "They open it on their phone, check items off and leave notes. No account or app needed.",
    },
    {
        title: "Organized room by room",
        body: "Group line items by area, set priorities, and keep property and unit details in one place.",
    },
    {
        title: "Know when the work is done",
        body: "Get an email when the job is marked complete, then review it, close it out or print it.",
    },
];

export default function Landing() {
    return (
        <div className="text-neutral-100">
            <header className="border-b border-neutral-800">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                    <Link href="/" className="font-semibold">
                        Work Order Generator
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/sign-in" className="text-sm text-neutral-400 hover:text-neutral-100">
                            Sign in
                        </Link>
                        <Link
                            href="/sign-up"
                            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                        >
                            Get started
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="mx-auto max-w-3xl px-4 py-24 text-center">
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        Work orders your contractors will actually use
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
                        Build a work order room by room, send your contractor a link, and watch items get checked off
                        as the work gets done. Nothing for them to install.
                    </p>
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

                {/* Features */}
                <section className="mx-auto max-w-5xl border-t border-neutral-800 px-4 py-20">
                    <div className="grid gap-10 sm:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <div key={feature.title}>
                                <h3 className="text-base font-medium">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{feature.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closing call to action */}
                <section className="mx-auto max-w-3xl border-t border-neutral-800 px-4 py-20 text-center">
                    <h2 className="text-2xl font-semibold">Send your next work order in minutes</h2>
                    <Link
                        href="/sign-up"
                        className="mt-8 inline-block rounded-md bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-white"
                    >
                        Get started
                    </Link>
                </section>
            </main>

            <footer className="mx-auto max-w-5xl border-t border-neutral-800 px-4 py-8 text-sm text-neutral-500">
                <p>&copy; {new Date().getFullYear()} Work Order Generator</p>
            </footer>
        </div>
    );
}
