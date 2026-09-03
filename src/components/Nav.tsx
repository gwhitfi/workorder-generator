import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Nav() {
    return (
        <header className="border-b border-neutral-800">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-semibold text-neutral-100">
                    Work Order Generator
                </Link>
                <nav className="flex items-center gap-6">
                    <Link href="/contacts" className="text-sm text-neutral-400 hover:text-neutral-100">
                        Contacts
                    </Link>
                    <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                        Properties
                    </Link>
                    <UserButton />
                </nav>
            </div>
        </header>
    );
}
