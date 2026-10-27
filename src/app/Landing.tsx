import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import HowItWorks from "@/components/HowItWorks";

const FEATURES = [
    {
        title: "Dedicated contractor links",
        body: "They open the link on their phone, check off items as completed, and leave notes. No account or app needed.",
    },
    {
        title: "Organized room by room",
        body: "Group line items by area, set priorities, attach photos, and keep property and unit details in one place.",
    },
    {
        title: "Completion confirmation",
        body: "Get an email when the job is marked complete, then review it, and close it out. Work orders stay in your archives for easy review later.",
    },
];

export default function Landing() {
    return (
        <div className="text-foreground">
            <header className="border-b border-line">
                <div className="mx-auto flex max-w-5xl items-center justify-end px-4 py-4">
                    <nav className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/sign-in" className="text-sm text-muted hover:text-foreground">
                            Sign in
                        </Link>
                        <Link
                            href="/demo"
                            className="rounded-md bg-status-closed px-4 py-2 text-sm font-medium text-on-accent hover:brightness-90"
                        >
                            Demo
                        </Link>
                        <Link
                            href="/sign-up"
                            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
                        >
                            Get started
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="mx-auto max-w-3xl px-4 py-24 text-center">
                    <h1>
                        <Logo className="mx-auto h-12 w-auto sm:h-16" />
                    </h1>
                    <p className="mt-6 text-lg font-medium sm:text-xl">Work orders for every property you manage.</p>
                    <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
                        Build a work order room by room, send your contractor a link, and watch items get checked off as
                        the work gets done. Nothing for them to install.
                    </p>
                </section>

                <div className="mx-auto max-w-5xl px-4 pb-20">
                    <HowItWorks />
                </div>

                {/* Features */}
                <section className="mx-auto max-w-5xl border-t border-line px-4 py-20">
                    <h2 className="text-center text-2xl font-semibold">Everything you need to get the work done</h2>
                    <div className="mt-12 grid gap-10 sm:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <div key={feature.title}>
                                <h3 className="text-base font-medium">{feature.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closing call to action */}
                <section className="mx-auto max-w-3xl border-t border-line px-4 py-20 text-center">
                    <h2 className="text-2xl font-semibold">Send your next work order in minutes</h2>
                    <Link
                        href="/sign-up"
                        className="mt-8 inline-block rounded-md bg-accent px-6 py-3 text-sm font-medium text-on-accent hover:bg-accent-hover"
                    >
                        Get started
                    </Link>
                </section>
            </main>

            <footer className="mx-auto max-w-5xl border-t border-line px-4 py-8 text-sm text-subtle">
                <p>&copy; {new Date().getFullYear()} Praedium</p>
            </footer>
        </div>
    );
}
