"use client";

import { useRef, useState } from "react";
import { removeLineItemPhoto, setLineItemPhoto } from "../actions";
import { resizePhoto, UnreadablePhotoError } from "@/lib/resizePhoto";

const linkClass = "text-xs text-neutral-500 hover:text-neutral-100 hover:cursor-pointer disabled:opacity-40";

export default function LineItemPhoto({
    lineItemId,
    description,
    photoId,
    readOnly,
}: {
    lineItemId: string;
    description: string;
    photoId: string | null;
    readOnly: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState<"uploading" | "removing" | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (readOnly && !photoId) return null;

    async function handleFile(file: File) {
        setBusy("uploading");
        setError(null);
        try {
            const formData = new FormData();
            formData.set("photo", await resizePhoto(file));
            const result = await setLineItemPhoto(lineItemId, formData);
            if (!result.ok) setError(result.error);
        } catch (e) {
            setError(e instanceof UnreadablePhotoError ? e.message : "The photo couldn't be uploaded. Try again.");
        } finally {
            setBusy(null);
            // Lets the same file be picked again after an error.
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    async function handleRemove() {
        setBusy("removing");
        setError(null);
        try {
            const result = await removeLineItemPhoto(lineItemId);
            if (!result.ok) setError(result.error);
        } catch {
            setError("The photo couldn't be removed. Try again.");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="ml-7 mt-1 flex flex-col gap-1">
            {photoId && (
                <a
                    href={`/work-orders/photos/${photoId}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-block self-start"
                    aria-label={`Open the photo for ${description}`}
                >
                    {/* next/image would fetch the private route without the user's session. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/work-orders/photos/${photoId}`}
                        alt={`Photo for ${description}`}
                        loading="lazy"
                        className="h-20 w-20 rounded border border-neutral-700 object-cover hover:border-neutral-400"
                    />
                </a>
            )}
            {!readOnly && (
                <div className="flex items-center gap-3">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy !== null}
                        className={linkClass}
                    >
                        {busy === "uploading" ? "Uploading..." : photoId ? "Replace photo" : "+ Photo"}
                    </button>
                    {photoId && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={busy !== null}
                            className="text-xs text-neutral-500 hover:text-red-400 hover:cursor-pointer disabled:opacity-40"
                        >
                            {busy === "removing" ? "Removing..." : "Remove photo"}
                        </button>
                    )}
                </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
    );
}
