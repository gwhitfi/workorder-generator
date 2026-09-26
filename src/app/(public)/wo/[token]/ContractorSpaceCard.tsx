"use client";

import { useState } from "react";
import { toggleLineItem, saveLineItemNote } from "./actions";
import { inputClass, PRIORITY_STYLES, PRIORITY_LABELS } from "@/lib/defaults";

type TagRow = { id: string; name: string };

type LineItemRow = {
    id: string;
    description: string;
    priority: string;
    completed: boolean;
    contractorNotes: string | null;
    tags: TagRow[];
};

type AreaRow = {
    id: string;
    name: string;
    lineItems: LineItemRow[];
};

export default function ContractorSpaceCard({
    token,
    area,
    readOnly,
}: {
    token: string;
    area: AreaRow;
    readOnly: boolean;
}) {
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notingId, setNotingId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState("");

    const doneCount = area.lineItems.filter((i) => i.completed).length;

    async function handleToggle(item: LineItemRow) {
        setBusyItemId(item.id);
        try {
            await toggleLineItem(token, item.id);
            setError(null);
        } catch {
            setError("Could not update that item. Try again.");
        } finally {
            setBusyItemId(null);
        }
    }

    function startNote(item: LineItemRow) {
        setNotingId(item.id);
        setNoteDraft(item.contractorNotes ?? "");
    }

    async function handleSaveNote(item: LineItemRow) {
        if (noteDraft.trim() === (item.contractorNotes ?? "")) {
            setNotingId(null);
            return;
        }

        setBusyItemId(item.id);
        try {
            await saveLineItemNote(token, item.id, noteDraft);
            setNotingId(null);
            setError(null);
        } catch {
            setError("Could not save that note. Try again.");
        } finally {
            setBusyItemId(null);
        }
    }

    return (
        <li className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3">
            <div className="flex items-center justify-between">
                <h3>{area.name}</h3>
                {area.lineItems.length > 0 && (
                    <span className="text-xs text-neutral-500">
                        {doneCount}/{area.lineItems.length} done
                    </span>
                )}
            </div>

            {area.lineItems.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-500">No items.</p>
            ) : (
                <ul className="mt-2 flex flex-col gap-1 text-base text-neutral-300">
                    {area.lineItems.map((item) => {
                        const busy = busyItemId === item.id;

                        return (
                            <li key={item.id} className="py-1">
                                <div className="flex items-start gap-3">
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={item.completed}
                                        aria-label={`Mark "${item.description}" ${item.completed ? "not done" : "done"}`}
                                        onClick={() => handleToggle(item)}
                                        disabled={readOnly || busy}
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-sm hover:cursor-pointer disabled:cursor-default disabled:opacity-60 ${
                                            item.completed
                                                ? "border-green-700 bg-green-900/40 text-green-400"
                                                : "border-neutral-600 hover:border-neutral-400"
                                        }`}
                                    >
                                        {item.completed && "✓"}
                                    </button>

                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                        <span className={item.completed ? "text-neutral-500 line-through" : "text-neutral-200"}>
                                            {item.description}
                                        </span>
                                        {item.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 text-xs text-neutral-400"
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                        {PRIORITY_STYLES[item.priority] && (
                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${PRIORITY_STYLES[item.priority]}`}
                                            >
                                                {PRIORITY_LABELS[item.priority]}
                                            </span>
                                        )}
                                    </div>

                                    {!readOnly && notingId !== item.id && !item.contractorNotes && (
                                        <button
                                            type="button"
                                            onClick={() => startNote(item)}
                                            className="shrink-0 text-sm text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                                        >
                                            + Note
                                        </button>
                                    )}
                                </div>

                                {notingId === item.id ? (
                                    <div className="ml-9 mt-2 flex flex-col gap-2">
                                        <textarea
                                            value={noteDraft}
                                            onChange={(e) => setNoteDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Escape") setNotingId(null);
                                            }}
                                            rows={3}
                                            maxLength={2000}
                                            placeholder="What was done, parts used, anything the office should know"
                                            autoFocus
                                            className={inputClass}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveNote(item)}
                                                disabled={busy}
                                                className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40"
                                            >
                                                {busy ? "Saving..." : "Save note"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNotingId(null)}
                                                className="shrink-0 px-2 text-sm text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    item.contractorNotes && (
                                        <p
                                            onClick={readOnly ? undefined : () => startNote(item)}
                                            className={`ml-9 mt-1 whitespace-pre-line rounded px-1 text-sm text-neutral-400 ${
                                                readOnly ? "" : "cursor-text hover:bg-neutral-800"
                                            }`}
                                        >
                                            {item.contractorNotes}
                                        </p>
                                    )
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </li>
    );
}
