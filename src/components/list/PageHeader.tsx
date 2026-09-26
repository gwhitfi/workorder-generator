import Link from "next/link";

export default function PageHeader({
    title,
    subtitle,
    actionHref,
    actionLabel,
}: {
    title: string;
    subtitle?: string;
    actionHref: string;
    actionLabel: string;
}) {
    return (
        <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
            </div>
            <Link
                href={actionHref}
                className="shrink-0 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white sm:px-4"
            >
                <span className="sm:hidden">+ Add</span>
                <span className="hidden sm:inline">{actionLabel}</span>
            </Link>
        </div>
    );
}
