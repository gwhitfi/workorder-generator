"use client";
import { useState } from "react";
import { createProperty } from "../actions";

export default function PropertyForm() {
    type Unit = {
        name: string;
        spaces: string[];
    };

    const [spaces, setSpaces] = useState<string[]>([]);
    const [draft, setDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [propertyType, setPropertyType] = useState("HOUSE");
    const [units, setUnits] = useState<Unit[]>([]);
    const [activeUnit, setActiveUnit] = useState(0);
    const [unitDraft, setUnitDraft] = useState("");
    const [unitError, setUnitError] = useState<string | null>(null);
    const MULTI_UNIT = ["DUPLEX", "APARTMENT", "CONDO", "TOWNHOUSE", "COMMERCIAL"];
    const showUnits = MULTI_UNIT.includes(propertyType);
    const activeSpaces = showUnits ? (units[activeUnit]?.spaces ?? []) : spaces;

    const inputClass =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
        "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

    const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

    function addSpace() {
        const name = draft.trim();
        if (!name) return;
        if (activeSpaces.some((s) => s.toLowerCase() === name.toLowerCase())) {
            setError(`"${name}" has already been added.`);
            return;
        }

        setActiveSpaces([...activeSpaces, name]);
        setDraft("");
        setError(null);
    }

    function moveSpace(from: number, to: number) {
        if (to < 0 || to >= activeSpaces.length) return;
        const next = [...activeSpaces];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        setActiveSpaces(next);
    }

    function setActiveSpaces(next: string[]) {
        if (showUnits) {
            setUnits(units.map((u, i) => (i === activeUnit ? { ...u, spaces: next } : u)));
        } else {
            setSpaces(next);
        }
    }
    function addUnit() {
        const name = unitDraft.trim();
        if (!name) return;
        if (units.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
            setUnitError(`"${name}" has already been added.`);
            return;
        }
        setUnits([...units, { name, spaces: [] }]);
        setUnitDraft("");
        setUnitError(null);
    }

    function removeUnit(index: number) {
        const next = units.filter((_, i) => i !== index);
        setUnits(next);
        if (activeUnit >= next.length) {
            setActiveUnit(Math.max(0, next.length - 1));
        }
    }
    return (
        <form action={createProperty} autoComplete="off" className="flex flex-col gap-4">
            <label className={labelClass}>
                Display Name
                <input name="displayName" required className={inputClass} />
            </label>
            <label className={labelClass}>
                Property Type
                <select
                    name="propertyType"
                    required
                    className={inputClass}
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                >
                    <option value="HOUSE">House</option>
                    <option value="DUPLEX">Duplex</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="CONDO">Condo</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="LAND">Land</option>
                </select>
            </label>
            <label className={labelClass}>
                Address
                <input name="addressLine1" required className={inputClass} />
            </label>
            <label className={labelClass}>
                Address (cont)
                <input name="addressLine2" className={inputClass} />
            </label>
            <div className="grid grid-cols-6 gap-3">
                <label className="col-span-3 block">
                    <span className={labelClass}>City</span>
                    <input name="city" required className={inputClass} />
                </label>

                <label className="col-span-1 block">
                    <span className={labelClass}>State</span>
                    <input name="state" required maxLength={2} className={inputClass} />
                </label>

                <label className="col-span-2 block">
                    <span className={labelClass}>Zip code</span>
                    <input name="zipCode" required className={inputClass} />
                </label>
            </div>
            <label className={labelClass}>
                Notes <textarea name="notes" className={inputClass} />
            </label>
            {showUnits && (
                <div className="flex flex-col gap-2">
                    <div className="border-t border-neutral-800 pt-6">
                        <h2 className="text-lg font-semibold text-neutral-100">Units</h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            Separate units at this address. Each unit gets its own space.
                        </p>
                    </div>
                    <input
                        value={unitDraft}
                        onChange={(e) => {
                            setUnitDraft(e.target.value);
                            setUnitError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                addUnit();
                            }
                        }}
                        placeholder="Unit A, Unit B, Apt 101, etc."
                        className={inputClass}
                    />
                    {unitError && <p className="text-sm text-red-400">{unitError}</p>}
                    <button
                        type="button"
                        onClick={addUnit}
                        className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer"
                    >
                        Add Unit
                    </button>
                    {units.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                const unit = units[activeUnit];
                                if (
                                    unit.spaces.length > 0 &&
                                    !confirm(`Remove ${unit.name} and its ${unit.spaces.length} spaces?`)
                                ) {
                                    return;
                                }
                                removeUnit(activeUnit);
                            }}
                            className="self-start text-sm text-neutral-500 hover:text-red-400 hover:cursor-pointer"
                        >
                            Remove {units[activeUnit]?.name}
                        </button>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {units.map((unit, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => {
                                    setActiveUnit(i);
                                    setDraft("");
                                    setError(null);
                                }}
                                className={`rounded-md px-3 py-1.5 text-sm border ${
                                    i === activeUnit
                                        ? "border-neutral-300 bg-neutral-800 hover:cursor-pointer"
                                        : "border-neutral-700 hover:cursor-pointer"
                                }`}
                            >
                                {unit.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
                {activeSpaces.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                        No spaces yet. You can add them later when creating a work order.
                    </p>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {activeSpaces.map((space, i) => {
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
                                            disabled={i === activeSpaces.length - 1}
                                            aria-label={`Move ${space} down`}
                                        >
                                            ↓
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveSpaces(activeSpaces.filter((_, index) => index !== i))}
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
                <input type="hidden" name="spaces" value={JSON.stringify(showUnits ? [] : spaces)} />
                <input type="hidden" name="units" value={JSON.stringify(showUnits ? units : [])} />
            </div>
            <button
                type="submit"
                className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100  hover:cursor-pointer"
            >
                Save Property
            </button>
        </form>
    );
}
