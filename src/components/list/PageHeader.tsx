import Link from "next/link";

export default function PageHeader({
    title,
    subtitle,
    actionHref,
    actionLabel,
    mobileLabel = "+ Add",
}: {
    title: string;
    subtitle?: string;
    actionHref: string;
    actionLabel: string;
    mobileLabel?: string;
}) {
    return (
        <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-subtle">{subtitle}</p>}
            </div>
            <Link
                href={actionHref}
                className="shrink-0 rounded-md bg-accent px-3 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover sm:px-4"
            >
                <span className="sm:hidden">{mobileLabel}</span>
                <span className="hidden sm:inline">{actionLabel}</span>
            </Link>
        </div>
    );
}
