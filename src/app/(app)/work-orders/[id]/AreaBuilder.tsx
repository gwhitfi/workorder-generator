"use client";

import { useState } from "react";
import { addArea } from "../actions";
import { inputClass } from "@/lib/defaults";

type SpaceOption = { id: string; name: string };
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

    async function handleAdd() {
        const trimmed = name.trim();
        if (!trimmed) return;

        setPending(true);
        try {
            await addArea(workOrderId, selectedSpace || null, trimmed);
            setName("");
            setSelectedSpace("");
        } catch {
            setError("Could not add that area. Try agian.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="border-t border-neutral-800 pt-6">
            <h2 className="text-lg font-semibold text-neutral-100">Areas</h2>
            <p className="mt-1 mb-4 text-sm text-neutral-500">
                Pick a space or type your own. You can rename it before adding.
            </p>

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
                    {spaces.map((space) => (
                        <option key={space.id} value={space.id}>
                            {space.name}
                        </option>
                    ))}
                </select>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                    }}
                    placeholder="Area name"
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
        </div>
    );
}
