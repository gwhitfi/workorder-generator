"use client";

import { useEffect, useRef, useState } from "react";
import { toggleTag, createTag } from "../actions";
import { inputClass } from "@/lib/defaults";

type TagRow = { id: string; name: string };

export default function TagModal({
    lineItemId,
    description,
    selectedTags,
    allTags,
    onClose,
}: {
    lineItemId: string;
    description: string;
    selectedTags: TagRow[];
    allTags: TagRow[];
    onClose: () => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [draft, setDraft] = useState("");
    const [pending, setPending] = useState(false);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const selectedIds = new Set(selectedTags.map((t) => t.id));

    async function handleToggle(tagId: string) {
        setPending(true);
        try {
            await toggleTag(lineItemId, tagId);
        } finally {
            setPending(false);
        }
    }

    async function handleCreate() {
        const name = draft.trim();
        if (!name) return;
        setPending(true);
        try {
            const tag = await createTag(name);
            await toggleTag(lineItemId, tag.id);
            setDraft("");
        } finally {
            setPending(false);
        }
    }

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            className="m-auto w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-6 text-neutral-100 backdrop:bg-black/60"
        >
            <h3 className="mb-1 text-lg font-semibold">Tags</h3>
            <p className="mb-4 text-sm text-neutral-500">{description}</p>
            <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                    const on = selectedIds.has(tag.id);
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggle(tag.id)}
                            disabled={pending}
                            className={`rounded border px-2 py-1 text-xs hover:cursor-pointer disabled:opacity-50 ${
                                on
                                    ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                            }`}
                        >
                            {tag.name}
                        </button>
                    );
                })}
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreate();
                        }
                    }}
                    placeholder="New tag"
                    className={inputClass}
                />
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={pending || !draft.trim()}
                    className="shrink-0 rounded-md border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40"
                >
                    Create
                </button>
            </div>
            <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="mt-6 w-full rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white hover:cursor-pointer"
            >
                Done
            </button>
        </dialog>
    );
}
