import Link from "next/link";
import React from "react";

export default function InfoCard({
    label,
    href,
    title,
    children,
}: {
    label: string;
    href?: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`relative rounded-lg border border-neutral-800 bg-neutral-900 p-4 ${href ? "hover:border-neutral-600" : ""}`}
        >
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">{label}</p>

            {href ? (
                <Link
                    href={href}
                    className="truncate block font-medium text-neutral-100 before:absolute before:inset-0 before:content-['']"
                >
                    {title}
                </Link>
            ) : (
                <p className="truncate font-medium text-neutral-100">{title}</p>
            )}

            <div className="relative z-10 mt-1 text-sm text-neutral-400 leading-relaxed">{children}</div>
        </div>
    );
}
