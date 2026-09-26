"use client";

import { useState } from "react";
import { completeWorkOrder } from "./actions";
import { inputClass } from "@/lib/defaults";

export default function CompleteWorkOrder({ token, remainingCount }: { token: string; remainingCount: number }) {
    const [notes, setNotes] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleComplete() {
        setPending(true);
        try {
            await completeWorkOrder(token, notes);
            setError(null);
        } catch {
            setError("Could not complete the work order. Try again.");
            setConfirming(false);
        } finally {
            setPending(false);
        }
    }

    return (
        <section className="mt-8 border-t border-neutral-800 pt-6">
            <h2 className="text-lg font-semibold text-neutral-100">Finish up</h2>
            <p className="mt-1 mb-4 text-sm text-neutral-500">
                Add any final notes for the office, then mark the work order complete.
            </p>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Completion notes (optional)"
                className={inputClass}
            />

            {remainingCount > 0 && (
                <p className="mt-2 text-sm text-amber-400">
                    {remainingCount} {remainingCount === 1 ? "item is" : "items are"} not checked off.
                </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {confirming ? (
                    <>
                        <span className="text-sm text-neutral-300">Mark this work order complete?</span>
                        <button
                            type="button"
                            onClick={handleComplete}
                            disabled={pending}
                            className="shrink-0 rounded-md border border-green-700 px-4 py-2 text-sm text-green-400 hover:bg-green-950 hover:cursor-pointer disabled:opacity-40"
                        >
                            {pending ? "Submitting..." : "Yes, complete"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            disabled={pending}
                            className="shrink-0 px-2 text-sm text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer"
                    >
                        Mark work order complete
                    </button>
                )}
            </div>

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </section>
    );
}
