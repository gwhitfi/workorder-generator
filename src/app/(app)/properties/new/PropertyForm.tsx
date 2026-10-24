"use client";
import { useActionState, useState } from "react";
import { createProperty } from "../actions";
import { MAX_UNIT_NAME_LENGTH, type PropertyFormState } from "../schemas";
import { MULTI_UNIT, PROPERTY_TYPE_LABELS, US_STATE_LABELS } from "@/lib/defaults";

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
    returnTo,
}: {
    initial?: PropertyFormValues;
    action?: (state: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
    submitLabel?: string;
    returnTo?: string;
} = {}) {
    const [state, formAction, pending] = useActionState(action, {});
    // React resets the form after each submit, so refill it with what was sent.
    const value = (name: keyof PropertyFormValues) => state.values?.[name] ?? initial?.[name];
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
        <form action={formAction} autoComplete="off" noValidate className="flex flex-col gap-4">
            <label className={labelClass}>
                Display Name
                <input
                    name="displayName"
                    required
                    maxLength={100}
                    defaultValue={value("displayName")}
                    className={inputClass}
                />
                <FieldError errors={state.errors?.displayName} />
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
                <FieldError errors={state.errors?.propertyType} />
            </label>
            <label className={labelClass}>
                Address
                <input
                    name="addressLine1"
                    required
                    maxLength={200}
                    defaultValue={value("addressLine1")}
                    className={inputClass}
                />
                <FieldError errors={state.errors?.addressLine1} />
            </label>
            <label className={labelClass}>
                Address (cont)
                <input
                    name="addressLine2"
                    maxLength={200}
                    defaultValue={value("addressLine2")}
                    className={inputClass}
                />
                <FieldError errors={state.errors?.addressLine2} />
            </label>
            <div className="grid grid-cols-6 gap-3">
                <label className="col-span-3 block">
                    <span className={labelClass}>City</span>
                    <input name="city" required maxLength={100} defaultValue={value("city")} className={inputClass} />
                    <FieldError errors={state.errors?.city} />
                </label>

                <label className="col-span-1 block">
                    <span className={labelClass}>State</span>
                    <select name="state" required defaultValue={value("state")} className={inputClass}>
                        <option value="">—</option>
                        {Object.entries(US_STATE_LABELS).map(([code, name]) => (
                            <option key={code} value={code} title={name}>
                                {code}
                            </option>
                        ))}
                    </select>
                    <FieldError errors={state.errors?.state} />
                </label>

                <label className="col-span-2 block">
                    <span className={labelClass}>Zip code</span>
                    <input name="zipCode" required defaultValue={value("zipCode")} className={inputClass} />
                    <FieldError errors={state.errors?.zipCode} />
                </label>
            </div>
            <label className={labelClass}>
                Notes <textarea name="notes" maxLength={5000} defaultValue={value("notes")} className={inputClass} />
                <FieldError errors={state.errors?.notes} />
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
                        maxLength={MAX_UNIT_NAME_LENGTH}
                        className={inputClass}
                    />
                    {unitError && <p className="text-sm text-red-400">{unitError}</p>}
                    <FieldError errors={state.errors?.units} />
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
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
            {state.error && <p className="text-sm text-red-400">{state.error}</p>}
            <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100  hover:cursor-pointer disabled:opacity-60"
            >
                {submitLabel}
            </button>
        </form>
    );
}

function FieldError({ errors }: { errors?: string[] }) {
    if (!errors?.length) return null;
    return <p className="mt-1 text-sm font-normal text-red-400">{errors[0]}</p>;
}
