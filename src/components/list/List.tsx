import Link from "next/link";
import React from "react";

export function List({ children }: { children: React.ReactNode }) {
    return (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface/40">{children}</ul>
    );
}

export function ListHeader({ cols, labels }: { cols: string; labels: string[] }) {
    return (
        <li
            aria-hidden
            className={`hidden gap-4 bg-surface px-4 py-2 text-xs uppercase tracking-wide text-subtle sm:grid ${cols}`}
        >
            {labels.map((label, i) => (
                <span key={i}>{label}</span>
            ))}
        </li>
    );
}

export function ListRow({
    href,
    label,
    cols,
    children,
}: {
    href: string;
    label: string;
    cols: string;
    children: React.ReactNode;
}) {
    return (
        <li className="relative transition-colors hover:bg-surface-hover/40">
            <div
                className={`flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-3 text-sm sm:grid sm:items-center sm:gap-4 ${cols}`}
            >
                {children}
            </div>
            <Link
                href={href}
                aria-label={label}
                className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
        </li>
    );
}

export function Cell({ className = "", children }: { className?: string; children?: React.ReactNode }) {
    return <div className={`min-w-0 empty:hidden sm:empty:block ${className}`}>{children}</div>;
}

export function ListLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a href={href} className="relative z-10 block truncate hover:text-foreground hover:underline">
            {children}
        </a>
    );
}

export function Favorite({ show }: { show: boolean }) {
    if (!show) return null;
    return (
        <span className="ml-1.5 text-warning" aria-label="Favorite">
            ★
        </span>
    );
}
