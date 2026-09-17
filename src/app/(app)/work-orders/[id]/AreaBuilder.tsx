"use client";

import { useState } from "react";
import { addArea, removeArea, moveArea } from "../actions";
import { inputClass } from "@/lib/defaults";

type SpaceOption = { id: string; name: string; unitId: string | null };
type AreaRow = { id: string; name: string };

export default function AreaBuilder({
    workOrderId,
    areas,
    spaces,
}: {
    workOrderId: string;
    areas: AreaRow[];
    spaces: SpaceOption[];
}) {
    const [selectedSpace, setSelectedSpace] = useState("");
    const [name, setName] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const propertySpaces = spaces.filter((s) => s.unitId !== null);
    const defaultSpaces = spaces.filter((s) => s.unitId === null);

    async function handleAdd() {
        const trimmed = name.trim();
        if (!trimmed) return;

        setPending(true);
        try {
            await addArea(workOrderId, selectedSpace || null, trimmed);
            setName("");
            setSelectedSpace("");
            setError(null);
        } catch {
            setError("Could not add that space. Try again.");
        } finally {
            setPending(false);
        }
    }
    async function handleMove(areaId: string, direction: "up" | "down") {
        setBusyId(areaId);
        try {
            await moveArea(areaId, direction);
        } catch {
            setError("Could not move that space.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemove(areaId: string) {
        setBusyId(areaId);
        try {
            await removeArea(areaId);
        } catch {
            setError("Could not remove that space.");
        } finally {
            setBusyId(null);
        }
    }
    return (
        <div className="border-t border-neutral-800 pt-6">
            <h2 className="text-lg font-semibold text-neutral-100">Spaces</h2>
            <p className="mt-1 mb-4 text-sm text-neutral-500">Which spaces in the property does this work order cover?</p>
            <div className="flex flex-col gap-2 sm:flex-row">
                <select
                    value={selectedSpace}
                    onChange={(e) => {
                        setSelectedSpace(e.target.value);
                        const space = spaces.find((s) => s.id === e.target.value);
                        setName(space?.name ?? "");
                    }}
                    className={inputClass}
                >
                    <option value="">Choose a space</option>
                    {propertySpaces.length > 0 && (
                        <optgroup label="This property">
                            {propertySpaces.map((space) => (
                                <option key={space.id} value={space.id}>
                                    {space.name}
                                </option>
                            ))}
                        </optgroup>
                    )}
                    <optgroup label="Common spaces">
                        {defaultSpaces.map((space) => (
                            <option key={space.id} value={space.id}>
                                {space.name}
                            </option>
                        ))}
                    </optgroup>
                </select>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                    }}
                    placeholder="Space name"
                    className={inputClass}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={pending || !name.trim()}
                    className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed"
                >
                    {pending ? "Adding..." : "Add space"}
                </button>
            </div>

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            {areas.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">No spaces added yet. Add one above.</p>
            ) : (
                <ul className="mt-4 flex flex-col gap-2">
                    {areas.map((area, i) => (
                        <li
                            key={area.id}
                            className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm"
                        >
                            <span>{area.name}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleMove(area.id, "up")}
                                    disabled={i === 0 || busyId === area.id}
                                    className="text-neutral-500 hover:text-neutral-100 hover:cursor-pointer disabled:opacity-30"
                                    aria-label={`Move ${area.name} up`}
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(area.id, "down")}
                                    disabled={i === areas.length - 1 || busyId === area.id}
                                    className="text-neutral-500 hover:text-neutral-100 hover:cursor-pointer disabled:opacity-30"
                                    aria-label={`Move ${area.name} down`}
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(area.id)}
                                    disabled={busyId === area.id}
                                    className="text-xs text-neutral-500 hover:text-red-400 hover:cursor-pointer disabled:opacity-30"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
