"use client";

import { useState } from "react";
import { addLineItem } from "../actions";
import { LineItemPriority } from "@/generated/prisma/enums";
import { inputClass } from "@/lib/defaults";

type LineItemRow = {
    id: string;
    description: string;
    priority: string;
};

type AreaRow = {
    id: string;
    name: string;
    lineItems: LineItemRow[];
};

export default function SpaceCard({
    area,
    index,
    total,
    onMove,
    onRemove,
    busy,
}: {
    area: AreaRow;
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
                <ul className="mt-2 flex flex-col gap-1 text-sm text-neutral-300">
                    {area.lineItems.map((item) => (
                        <li key={item.id} className="flex gap-2">
                            <span className="text-neutral-600">*</span>
                            <span>{item.description}</span>
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
                            <option value="EMERGENCY">Emergency</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
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
        </li>
    );
}
