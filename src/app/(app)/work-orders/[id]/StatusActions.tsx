"use client";

import { useState } from "react";
import { sendWorkOrder, markWorkOrderCompleted, reopenWorkOrder, closeWorkOrder } from "../actions";
import { DeliveryMethod } from "@/generated/prisma/enums";

export default function StatusActions({
    workOrderId,
    status,
    hasContractor,
}: {
    workOrderId: string;
    status: string;
    hasContractor: boolean;
}) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function run(fn: () => Promise<void>) {
        setPending(true);
        setError(null);
        try {
            await fn();
        } catch {
            setError("Something went wrong. Try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {status === "DRAFT" && (
                <>
                    <button
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        onClick={() => run(() => sendWorkOrder(workOrderId, "PRINT" as DeliveryMethod))}
                        disabled={pending || !hasContractor}
                    >
                        Mark as sent
                    </button>
                    {!hasContractor && <span className="text-sm text-neutral-500">Assign a contractor to send.</span>}
                </>
            )}
            {(status === "SENT" || status === "IN_PROGRESS") && (
                <>
                    <button
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        onClick={() => run(() => markWorkOrderCompleted(workOrderId))}
                        disabled={pending}
                    >
                        Mark completed
                    </button>
                    <button
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        onClick={() => run(() => closeWorkOrder(workOrderId))}
                        disabled={pending}
                    >
                        Close
                    </button>
                </>
            )}
            {status === "COMPLETED" && (
                <>
                    <button
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        onClick={() => run(() => closeWorkOrder(workOrderId))}
                        disabled={pending}
                    >
                        Close
                    </button>
                    <button
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        onClick={() => run(() => reopenWorkOrder(workOrderId))}
                        disabled={pending}
                    >
                        Reopen
                    </button>
                </>
            )}
            {status === "CLOSED" && (
                <button
                    className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                    onClick={() => run(() => reopenWorkOrder(workOrderId))}
                    disabled={pending}
                >
                    Reopen
                </button>
            )}
            {error && <p className="w-full text-sm text-red-400">{error}</p>}
        </div>
    );
}
