"use client";

import { useState } from "react";
import { addLineItem, removeLineItem, moveLineItem, updateLineItem } from "../actions";
import { LineItemPriority } from "@/generated/prisma/enums";
import { inputClass, PRIORITY_STYLES, PRIORITY_LABELS } from "@/lib/defaults";
import TagModal from "./TagModal";

type TagRow = { id: string; name: string };

type LineItemRow = {
    id: string;
    description: string;
    priority: string;
    tags: TagRow[];
};

type AreaRow = {
    id: string;
    name: string;
    lineItems: LineItemRow[];
};

export default function SpaceCard({
    area,
    index,
    tags,
    total,
    onMove,
    onRemove,
    busy,
}: {
    area: AreaRow;
    tags: TagRow[];
    index: number;
    total: number;
    onMove: (id: string, direction: "up" | "down") => void;
    onRemove: (id: string) => void;
    busy: boolean;
}) {
    const [adding, setAdding] = useState(false);
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [tagModalFor, setTagModalFor] = useState<string | null>(null);
    const modalItem = area.lineItems.find((i) => i.id === tagModalFor);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState("");

    async function handleAddItem() {
        const trimmed = description.trim();
        if (!trimmed) return;

        setPending(true);
        try {
            await addLineItem(area.id, trimmed, priority as LineItemPriority);
            setDescription("");
            setError(null);
        } catch {
            setError("Could not add that item. Try again.");
        } finally {
            setPending(false);
        }
    }

    async function handleRemoveItem(lineItemId: string) {
        setBusyItemId(lineItemId);
        try {
            await removeLineItem(lineItemId);
            setError(null);
        } catch {
            setError("Could not remove that item.");
        } finally {
            setBusyItemId(null);
        }
    }

    async function handleMoveItem(lineItemId: string, direction: "up" | "down") {
        setBusyItemId(lineItemId);
        try {
            await moveLineItem(lineItemId, direction);
            setError(null);
        } catch {
            setError("Could not move that item.");
        } finally {
            setBusyItemId(null);
        }
    }

    async function handleSaveEdit(item: LineItemRow) {
        const trimmed = editDraft.trim();

        if (!trimmed || trimmed === item.description) {
            setEditingId(null);
            return;
        }

        setBusyItemId(item.id);
        try {
            await updateLineItem(item.id, trimmed, item.priority as LineItemPriority);
            setEditingId(null);
            setError(null);
        } catch {
            setError("Could not save that change.");
        } finally {
            setBusyItemId(null);
        }
    }
    return (
        <li className="rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3">
            <div className="flex items-center justify-between">
                <h3>{area.name}</h3>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onMove(area.id, "up")}
                        disabled={index === 0 || busy}
                        className="text-neutral-500 hover:text-neutral-100 hover:cursor-pointer disabled:opacity-30"
                        aria-label={`Move ${area.name} up`}
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={() => onMove(area.id, "down")}
                        disabled={index === total - 1 || busy}
                        className="text-neutral-500 hover:text-neutral-100 hover:cursor-pointer disabled:opacity-30"
                        aria-label={`Move ${area.name} down`}
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemove(area.id)}
                        disabled={busy}
                        className="text-xs text-neutral-500 hover:text-red-400 hover:cursor-pointer disabled:opacity-30"
                    >
                        Remove
                    </button>
                </div>
            </div>
            {area.lineItems.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-base text-neutral-300">
                    {area.lineItems.map((item, i) => (
                        <li key={item.id} className="group flex items-center gap-2">
                            <span className="text-neutral-200">•</span>
                            {editingId === item.id ? (
                                <input
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    onBlur={() => handleSaveEdit(item)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit(item);
                                        if (e.key === "Escape") setEditingId(null);
                                    }}
                                    autoFocus
                                    className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-0.5 text-base text-neutral-100 focus:outline-none"
                                />
                            ) : (
                                <span
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setEditDraft(item.description);
                                    }}
                                    className="cursor-text rounded px-1 hover:bg-neutral-800"
                                >
                                    {item.description}
                                </span>
                            )}
                            {item.tags.map((tag) => (
                                <span
                                    key={tag.id}
                                    className="shrink-0 rounded border border-neutral-700 px-1.5 py-0.5 text-xs text-neutral-400 cursor-default"
                                >
                                    {tag.name}
                                </span>
                            ))}
                            {PRIORITY_STYLES[item.priority] && (
                                <span
                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs cursor-default ${PRIORITY_STYLES[item.priority]}`}
                                >
                                    {PRIORITY_LABELS[item.priority]}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => handleMoveItem(item.id, "up")}
                                disabled={i === 0 || busyItemId === item.id}
                                className="text-xs text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-100 hover:cursor-pointer disabled:text-neutral-800 disabled:hover:text-neutral-800"
                                aria-label={`Move ${item.description} up`}
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMoveItem(item.id, "down")}
                                disabled={i === area.lineItems.length - 1 || busyItemId === item.id}
                                className="text-xs text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-100 hover:cursor-pointer disabled:text-neutral-800 disabled:hover:text-neutral-800"
                                aria-label={`Move ${item.description} down`}
                            >
                                ↓
                            </button>

                            <button
                                type="button"
                                onClick={() => setTagModalFor(item.id)}
                                className="text-xs text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-neutral-100 hover:cursor-pointer"
                            >
                                Tags
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={busyItemId === item.id}
                                className="text-xs text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 hover:cursor-pointer disabled:text-neutral-800 disabled:hover:text-neutral-800"
                                aria-label={`Remove ${item.description}`}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {!adding && (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-3 text-sm text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                >
                    + Add line item
                </button>
            )}

            {adding && (
                <div className="mt-3 flex flex-col gap-2">
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddItem();
                        }}
                        placeholder="Add work item"
                        autoFocus
                        className={inputClass}
                    />
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex gap-2">
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
                            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleAddItem}
                            disabled={pending || !description.trim()}
                            className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40"
                        >
                            {pending ? "Adding..." : "Add"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setAdding(false)}
                            className="shrink-0 px-2 text-sm text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {modalItem && (
                <TagModal
                    lineItemId={modalItem.id}
                    description={modalItem.description}
                    selectedTags={modalItem.tags}
                    allTags={tags}
                    onClose={() => setTagModalFor(null)}
                />
            )}
        </li>
    );
}
