"use client";
import { useState } from "react";

export default function PropertyForm() {
    const [spaces, setSpaces] = useState<string[]>([]);
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);

    const inputClass =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
        "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

    function addSpace() {
        const name = draft.trim();
        if (!name) return;
        if (spaces.some((s) => s.toLowerCase() === name.toLowerCase())) {
            setError(`"${name}" has already been added.`);
            return;
        }
        setSpaces([...spaces, name]);
        setDraft("");
        setError(null);
    }

    function moveSpace(from: number, to: number) {
        if (to < 0 || to >= spaces.length) return;
        const next = [...spaces];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setSpaces(next);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="border-t border-neutral-800 pt-6">
                <h2 className="text-lg font-semibold text-neutral-100">Spaces</h2>
                <p className="text-sm text-neutral-500 mt-1">Rooms and areas at this property. Optional.</p>
            </div>
            <input
                value={draft}
                onChange={(e) => {
                    setDraft(e.target.value);
                    setError(null);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        addSpace();
                    }
                }}
                placeholder="Kitchen, Front Bedroom, Back Porch, etc."
                className={inputClass}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
                type="button"
                onClick={addSpace}
                className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer"
            >
                Add
            </button>
            {spaces.length === 0 ? (
                <p className="text-sm text-neutral-500">No spaces yet. You can add them later when creating a work order.</p>
            ) : (
                <ul className="flex flex-col gap-1">
                    {spaces.map((space, i) => {
                        return (
                            <li
                                key={i}
                                className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
                            >
                                {space}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="text-neutral-500 hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-500 hover:cursor-pointer"
                                        onClick={() => moveSpace(i, i - 1)}
                                        disabled={i === 0}
                                        aria-label={`Move ${space} up`}
                                    >
                                        ↑
                                    </button>
                                    <button
                                        type="button"
                                        className="text-neutral-500 hover:text-neutral-100 disabled:opacity-30 disabled:hover:text-neutral-500 hover:cursor-pointer"
                                        onClick={() => moveSpace(i, i + 1)}
                                        disabled={i === spaces.length - 1}
                                        aria-label={`Move ${space} down`}
                                    >
                                        ↓
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSpaces(spaces.filter((_, index) => index !== i))}
                                        className="text-xs text-neutral-500 hover:text-red-400 hover:cursor-pointer"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        <input type="hidden" name="spaces" value={JSON.stringify(spaces)} />
        </div>

    );
}
