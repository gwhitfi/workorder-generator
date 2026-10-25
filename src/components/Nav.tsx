import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "./ThemeToggle";

export default function Nav() {
    return (
        <header className="border-b border-line print:hidden">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-semibold text-foreground">
                    Work Order Generator
                </Link>
                <nav className="flex items-center gap-6">
                    <Link href="/work-orders" className="text-sm text-muted hover:text-foreground">
                        Work Orders
                    </Link>
                    <Link href="/contacts" className="text-sm text-muted hover:text-foreground">
                        Contacts
                    </Link>
                    <Link href="/properties" className="text-sm text-muted hover:text-foreground">
                        Properties
                    </Link>
                    <Link href="/settings" className="text-sm text-muted hover:text-foreground">
                        Settings
                    </Link>
                    <ThemeToggle />
                    <UserButton />
                </nav>
            </div>
        </header>
    );
}
