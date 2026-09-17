"use client";

import { useState } from "react";

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
        </li>
    );
}
