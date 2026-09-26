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
        <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-12 text-center">
            <p className="text-sm text-neutral-400">{message}</p>
            <Link href={actionHref} className="mt-3 inline-block text-sm text-neutral-100 underline hover:text-white">
                {actionLabel}
            </Link>
        </div>
    );
}
