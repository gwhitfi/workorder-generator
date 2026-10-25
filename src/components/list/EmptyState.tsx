import Link from "next/link";

export default function EmptyState({
    message,
    actionHref,
    actionLabel,
}: {
    message: string;
    actionHref: string;
    actionLabel: string;
}) {
    return (
        <div className="rounded-lg border border-dashed border-line px-4 py-12 text-center">
            <p className="text-sm text-muted">{message}</p>
            <Link href={actionHref} className="mt-3 inline-block text-sm text-accent underline hover:text-accent-hover">
                {actionLabel}
            </Link>
        </div>
    );
}
