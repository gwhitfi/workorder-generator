"use client";

import { useState } from "react";
import { addArea, removeArea, moveArea } from "../actions";
import { inputClass } from "@/lib/defaults";
import SpaceCard from "./SpaceCard";

type AreaRow = {
    id: string;
    name: string;
    lineItems: {
        id: string;
        description: string;
        priority: string;
        completed: boolean;
        completedAt: Date | null;
        contractorNotes: string | null;
    }[];
};

export default function AreaBuilder({
    workOrderId,
    areas,
    readOnly = false,
    notice,
}: {
    workOrderId: string;
    areas: AreaRow[];
    readOnly?: boolean;
    notice?: string;
}) {
    const [name, setName] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    async function handleAdd() {
        const trimmed = name.trim();
        if (!trimmed) return;

        setPending(true);
        try {
            await addArea(workOrderId, trimmed);
            setName("");
            setError(null);
        } catch {
            setError("Could not add that area. Try again.");
        } finally {
            setPending(false);
        }
    }
    async function handleMove(areaId: string, direction: "up" | "down") {
        setBusyId(areaId);
        try {
            await moveArea(areaId, direction);
        } catch {
            setError("Could not move that area.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemove(areaId: string) {
        setBusyId(areaId);
        try {
            await removeArea(areaId);
        } catch {
            setError("Could not remove that area.");
        } finally {
            setBusyId(null);
        }
    }
    return (
        <div className="border-t border-neutral-800 pt-6">
            <h2 className="text-lg font-semibold text-neutral-100">Areas</h2>
            {notice && (
                <p className="mt-2 rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
                    {notice}
                </p>
            )}
            {!readOnly && (
                <>
                    <p className="mt-1 mb-4 text-sm text-neutral-500">
                        Group the work by area: a room, the roof, the yard…
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAdd();
                            }}
                            placeholder="Area name (Kitchen, Roof, Back yard…)"
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={pending || !name.trim()}
                            className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                        >
                            {pending ? "Adding..." : "Add area"}
                        </button>
                    </div>
                </>
            )}

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            {areas.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">
                    {readOnly ? "No areas on this work order." : "No areas added yet. Add one above."}
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-2">
                    {areas.map((area, i) => (
                        <SpaceCard
                            key={area.id}
                            area={area}
                            index={i}
                            total={areas.length}
                            onMove={handleMove}
                            onRemove={handleRemove}
                            busy={busyId === area.id}
                            readOnly={readOnly}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
