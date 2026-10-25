"use client";

import { useRef, useState } from "react";

type Result = { ok: true } | { ok: false; error: string } | void;

const outlineButton =
    "shrink-0 rounded-md border border-line-strong px-4 py-2 text-sm text-foreground hover:bg-surface-hover hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed";

// The server action gets the typed text too and refuses anything but "yes".
export default function DeleteButton({
    itemName,
    label = "Delete permanently",
    onDelete,
    archiveInstead,
    triggerClassName = "shrink-0 rounded-md px-4 py-2 text-sm text-subtle hover:text-danger hover:cursor-pointer",
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
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-danger/40 bg-surface p-0 text-foreground backdrop:bg-black/70"
            >
                <div className="p-5">
                    <h2 className="mb-2 text-lg font-semibold">Delete &ldquo;{itemName}&rdquo; permanently?</h2>
                    <p className="mb-3 text-sm font-medium text-danger">This cannot be undone.</p>

                    {children && <div className="flex flex-col gap-2 text-sm text-secondary">{children}</div>}

                    {archiveInstead && (
                        <p className="mt-3 text-sm text-muted">
                            Want to keep the history?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    dialogRef.current?.close();
                                    archiveInstead();
                                }}
                                className="text-foreground underline hover:cursor-pointer"
                            >
                                Archive instead
                            </button>
                        </p>
                    )}

                    <label className="mt-4 block text-sm text-secondary">
                        Type <strong className="text-foreground">yes</strong> to confirm
                        <input
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && confirmed && !pending) handleDelete();
                            }}
                            autoComplete="off"
                            className="mt-1 w-full rounded-md border border-line-strong bg-background px-3 py-2 text-sm text-foreground focus:border-danger focus:outline-none"
                        />
                    </label>

                    {error && <p className="mt-3 text-sm text-danger">{error}</p>}

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
                            className="shrink-0 rounded-md bg-danger-strong px-4 py-2 text-sm font-medium text-white hover:bg-danger-strong/85 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        >
                            {pending ? "Deleting..." : "Delete forever"}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
