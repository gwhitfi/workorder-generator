"use client";

import { useRef, useState } from "react";

type Result = { ok: true } | { ok: false; error: string } | void;

const outlineButton =
    "shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed";

// The server action gets the typed text too and refuses anything but "yes".
export default function DeleteButton({
    itemName,
    label = "Delete permanently",
    onDelete,
    archiveInstead,
    triggerClassName = "shrink-0 rounded-md px-4 py-2 text-sm text-neutral-500 hover:text-red-400 hover:cursor-pointer",
    children,
}: {
    itemName: string;
    label?: React.ReactNode;
    onDelete: (confirmation: string) => Promise<Result>;
    archiveInstead?: () => void;
    triggerClassName?: string;
    children?: React.ReactNode;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [typed, setTyped] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const confirmed = typed.trim().toLowerCase() === "yes";

    function open() {
        setTyped("");
        setError(null);
        dialogRef.current?.showModal();
    }

    async function handleDelete() {
        setPending(true);
        setError(null);
        try {
            const res = await onDelete(typed);
            if (res && !res.ok) {
                setError(res.error);
            } else {
                dialogRef.current?.close();
            }
        } catch {
            setError("Could not delete. Try again.");
        } finally {
            setPending(false);
        }
    }

    return (
        <>
            <button type="button" onClick={open} className={triggerClassName} aria-label={`Delete ${itemName}`}>
                {label}
            </button>

            <dialog
                ref={dialogRef}
                onClick={(e) => {
                    if (e.target === dialogRef.current && !pending) dialogRef.current.close();
                }}
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-red-900 bg-neutral-900 p-0 text-neutral-100 backdrop:bg-black/70"
            >
                <div className="p-5">
                    <h2 className="mb-2 text-lg font-semibold">Delete &ldquo;{itemName}&rdquo; permanently?</h2>
                    <p className="mb-3 text-sm font-medium text-red-400">This cannot be undone.</p>

                    {children && <div className="flex flex-col gap-2 text-sm text-neutral-300">{children}</div>}

                    {archiveInstead && (
                        <p className="mt-3 text-sm text-neutral-400">
                            Want to keep the history?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    dialogRef.current?.close();
                                    archiveInstead();
                                }}
                                className="text-neutral-100 underline hover:cursor-pointer"
                            >
                                Archive instead
                            </button>
                        </p>
                    )}

                    <label className="mt-4 block text-sm text-neutral-300">
                        Type <strong className="text-neutral-100">yes</strong> to confirm
                        <input
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && confirmed && !pending) handleDelete();
                            }}
                            autoComplete="off"
                            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-red-500 focus:outline-none"
                        />
                    </label>

                    {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => dialogRef.current?.close()}
                            disabled={pending}
                            className={outlineButton}
                        >
                            Go back
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={!confirmed || pending}
                            className="shrink-0 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        >
                            {pending ? "Deleting..." : "Delete forever"}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
