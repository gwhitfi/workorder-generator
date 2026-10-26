import Link from "next/link";
import React from "react";
import TruncatedText from "./TruncatedText";

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
            className={`relative rounded-lg border border-line bg-surface p-4 ${href ? "hover:border-line-hover" : ""}`}
        >
            <p className="mb-2 text-xs uppercase tracking-wide text-subtle">{label}</p>

            {href ? (
                <Link
                    href={href}
                    className="block font-medium text-foreground before:absolute before:inset-0 before:content-['']"
                >
                    <TruncatedText text={title} />
                </Link>
            ) : (
                <p className="font-medium text-foreground">
                    <TruncatedText text={title} />
                </p>
            )}

            <div className="relative z-10 mt-1 text-sm text-muted leading-relaxed wrap-anywhere">{children}</div>
        </div>
    );
}
