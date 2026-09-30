"use client";
import { useState } from "react";
import { createProperty } from "../actions";
import { MULTI_UNIT, PROPERTY_TYPE_LABELS } from "@/lib/defaults";

export type PropertyFormValues = {
    displayName: string;
    propertyType: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    notes: string;
};

export default function PropertyForm({
    initial,
    action = createProperty,
    submitLabel = "Save Property",
}: {
    initial?: PropertyFormValues;
    action?: (formData: FormData) => void | Promise<void>;
    submitLabel?: string;
} = {}) {
    const editing = !!initial;
    type Unit = { name: string };

    const [propertyType, setPropertyType] = useState(initial?.propertyType ?? "HOUSE");
    const [units, setUnits] = useState<Unit[]>([]);
    const [unitDraft, setUnitDraft] = useState("");
    const [unitError, setUnitError] = useState<string | null>(null);
    const showUnits = MULTI_UNIT.includes(propertyType);

    const inputClass =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
        "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

    const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

    function addUnit() {
        const name = unitDraft.trim();
        if (!name) return;
        if (units.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
            setUnitError(`"${name}" has already been added.`);
            return;
        }
        setUnits([...units, { name }]);
        setUnitDraft("");
        setUnitError(null);
    }

    function removeUnit(index: number) {
        setUnits(units.filter((_, i) => i !== index));
    }
    return (
        <form action={action} autoComplete="off" className="flex flex-col gap-4">
            <label className={labelClass}>
                Display Name
                <input name="displayName" required defaultValue={initial?.displayName} className={inputClass} />
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
                    {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </label>
            <label className={labelClass}>
                Address
                <input name="addressLine1" required defaultValue={initial?.addressLine1} className={inputClass} />
            </label>
            <label className={labelClass}>
                Address (cont)
                <input name="addressLine2" defaultValue={initial?.addressLine2} className={inputClass} />
            </label>
            <div className="grid grid-cols-6 gap-3">
                <label className="col-span-3 block">
                    <span className={labelClass}>City</span>
                    <input name="city" required defaultValue={initial?.city} className={inputClass} />
                </label>

                <label className="col-span-1 block">
                    <span className={labelClass}>State</span>
                    <input name="state" required maxLength={2} defaultValue={initial?.state} className={inputClass} />
                </label>

                <label className="col-span-2 block">
                    <span className={labelClass}>Zip code</span>
                    <input name="zipCode" required defaultValue={initial?.zipCode} className={inputClass} />
                </label>
            </div>
            <label className={labelClass}>
                Notes <textarea name="notes" defaultValue={initial?.notes} className={inputClass} />
            </label>
            {showUnits && !editing && (
                <div className="flex flex-col gap-2">
                    <div className="border-t border-neutral-800 pt-6">
                        <h2 className="text-lg font-semibold text-neutral-100">Units</h2>
                        <p className="text-sm text-neutral-500 mt-1">Separate units at this address.</p>
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
                        <ul className="flex flex-wrap gap-2">
                            {units.map((unit, i) => (
                                <li
                                    key={unit.name}
                                    className="flex items-center gap-2 rounded-md border border-neutral-700 px-3 py-1.5 text-sm"
                                >
                                    {unit.name}
                                    <button
                                        type="button"
                                        onClick={() => removeUnit(i)}
                                        className="text-neutral-500 hover:text-red-400 hover:cursor-pointer"
                                        aria-label={`Remove ${unit.name}`}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <input type="hidden" name="units" value={JSON.stringify(units)} />
                </div>
            )}

            <button
                type="submit"
                className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100  hover:cursor-pointer"
            >
                {submitLabel}
            </button>
        </form>
    );
}
