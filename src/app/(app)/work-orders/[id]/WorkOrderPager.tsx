"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { WorkOrderPagerLinks } from "@/lib/workOrderList";

const barButton = "flex h-7 w-7 items-center justify-center rounded-full border border-line-strong lg:hidden";
const edgeButton =
    "fixed top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-lg text-muted shadow-lg lg:flex";

// Previous and next work order in the list this one was opened from: round buttons at the screen edges on
// wide screens, a "‹ 3 of 20 ›" bar on narrow ones, and the ← and → keys (ignored while typing or in a dialog).
export default function WorkOrderPager({ position, total, previousHref, nextHref }: WorkOrderPagerLinks) {
    const router = useRouter();

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const target = event.target as HTMLElement;
            if (
                target.closest("input, textarea, select, [contenteditable]") ||
                document.querySelector("dialog[open]")
            ) {
                return;
            }

            const href = event.key === "ArrowLeft" ? previousHref : event.key === "ArrowRight" ? nextHref : null;
            if (!href) return;
            event.preventDefault();
            router.push(href);
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [router, previousHref, nextHref]);

    return (
        <nav
            aria-label="Work orders"
            className="mb-4 flex items-center justify-end gap-2 text-sm text-subtle print:hidden"
        >
            <PagerLink href={previousHref} label="Previous work order" shortcut="ArrowLeft" className={barButton}>
                ‹
            </PagerLink>
            <span>
                {position} of {total}
            </span>
            <PagerLink href={nextHref} label="Next work order" shortcut="ArrowRight" className={barButton}>
                ›
            </PagerLink>

            <PagerLink
                href={previousHref}
                label="Previous work order"
                shortcut="ArrowLeft"
                className={`${edgeButton} left-4`}
            >
                ←
            </PagerLink>
            <PagerLink
                href={nextHref}
                label="Next work order"
                shortcut="ArrowRight"
                className={`${edgeButton} right-4`}
            >
                →
            </PagerLink>
        </nav>
    );
}

// A link, or a dimmed placeholder at either end of the list.
function PagerLink({
    href,
    label,
    shortcut,
    className,
    children,
}: {
    href: string | null;
    label: string;
    shortcut: string;
    className: string;
    children: React.ReactNode;
}) {
    if (!href) {
        return (
            <span aria-hidden className={`${className} opacity-30`}>
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            aria-label={label}
            aria-keyshortcuts={shortcut}
            className={`${className} hover:border-line-hover hover:text-foreground`}
        >
            {children}
        </Link>
    );
}
