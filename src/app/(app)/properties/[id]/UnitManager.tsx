"use client";

import { useState } from "react";
import { addUnit, renameUnit, archiveUnit, deleteUnit, addSpace, renameSpace, deleteSpace } from "../actions";
import { inputClass } from "@/lib/defaults";
import DeleteButton from "@/components/DeleteButton";

type SpaceRow = { id: string; name: string };
type UnitRow = {
    id: string;
    name: string;
    spaces: SpaceRow[];
    openCount: number;
    workOrderCount: number;
    tenantCount: number;
};
type Result = { ok: true } | { ok: false; error: string };

const smallButton =
    "shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-100 hover:bg-neutral-800 hover:cursor-pointer disabled:opacity-40 disabled:hover:cursor-not-allowed";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function UnitManager({
    propertyId,
    units,
    manageUnits,
}: {
    propertyId: string;
    units: UnitRow[];
    manageUnits: boolean;
}) {
    return (
        <div className="flex flex-col gap-3">
            {units.map((unit) => (
                <UnitCard key={unit.id} unit={unit} manageUnits={manageUnits} canArchive={units.length > 1} />
            ))}
            {manageUnits && (
                <AddInput
                    placeholder="Unit name (Unit C, Apt 102…)"
                    buttonLabel="+ Add unit"
                    onAdd={(name) => addUnit(propertyId, name)}
                />
            )}
        </div>
    );
}

function UnitCard({ unit, manageUnits, canArchive }: { unit: UnitRow; manageUnits: boolean; canArchive: boolean }) {
    const [confirming, setConfirming] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleArchive() {
        setPending(true);
        const res = await archiveUnit(unit.id);
        setPending(false);
        if (!res.ok) {
            setError(res.error);
            setConfirming(false);
        }
    }

    return (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            {manageUnits && (
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <InlineName
                        value={unit.name}
                        onSave={(name) => renameUnit(unit.id, name)}
                        className="font-medium"
                        label="unit name"
                    />
                    <span className="text-xs text-neutral-500">{plural(unit.spaces.length, "space", "spaces")}</span>
                </div>
            )}

            {unit.spaces.length === 0 ? (
                <p className="text-sm text-neutral-500">No spaces added.</p>
            ) : (
                <ul className="flex flex-wrap gap-2">
                    {unit.spaces.map((space) => (
                        <SpaceChip key={space.id} space={space} />
                    ))}
                </ul>
            )}

            <div className="mt-3">
                <AddInput
                    placeholder="Add a space (Kitchen, Back Porch…)"
                    buttonLabel="Add"
                    onAdd={(name) => addSpace(unit.id, name)}
                />
            </div>

            {manageUnits && canArchive && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-800 pt-3 text-sm">
                    {unit.openCount > 0 ? (
                        <p className="text-neutral-500">
                            Can&apos;t archive: {plural(unit.openCount, "open work order", "open work orders")}. Close
                            or cancel {unit.openCount === 1 ? "it" : "them"} first.
                        </p>
                    ) : confirming ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-neutral-300">
                                Archive {unit.name}?
                                {unit.tenantCount > 0 &&
                                    ` ${plural(unit.tenantCount, "tenant", "tenants")} will be unlinked from this unit but stay in Contacts.`}
                            </span>
                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={pending}
                                className="text-red-400 hover:text-red-300 hover:cursor-pointer disabled:opacity-40"
                            >
                                {pending ? "Archiving..." : "Yes, archive"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                disabled={pending}
                                className="text-neutral-500 hover:text-neutral-100 hover:cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                setConfirming(true);
                            }}
                            className="text-neutral-500 hover:text-red-400 hover:cursor-pointer"
                        >
                            Archive unit
                        </button>
                    )}
                    {!confirming && (
                        <DeleteButton
                            itemName={unit.name}
                            label="Delete unit"
                            onDelete={(confirmation) => deleteUnit(unit.id, confirmation)}
                            archiveInstead={
                                unit.openCount === 0
                                    ? () => {
                                          setError(null);
                                          setConfirming(true);
                                      }
                                    : undefined
                            }
                            triggerClassName="text-neutral-500 hover:text-red-400 hover:cursor-pointer"
                        >
                            {unit.workOrderCount > 0 && (
                                <p className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-red-200">
                                    This also permanently deletes{" "}
                                    <strong>{plural(unit.workOrderCount, "work order", "work orders")}</strong> for this
                                    unit, <strong>including archived ones</strong>.
                                    {unit.openCount > 0 &&
                                        ` ${unit.openCount} ${unit.openCount === 1 ? "is" : "are"} still open; contractors who were sent a link will be emailed that it's cancelled.`}
                                </p>
                            )}
                            {unit.spaces.length > 0 && (
                                <p>Its {plural(unit.spaces.length, "space", "spaces")} will be deleted.</p>
                            )}
                            {unit.tenantCount > 0 && (
                                <p>
                                    {plural(unit.tenantCount, "tenant", "tenants")} will be unlinked but stay in
                                    Contacts.
                                </p>
                            )}
                        </DeleteButton>
                    )}
                    {error && <p className="basis-full text-red-400">{error}</p>}
                </div>
            )}
        </div>
    );
}

function SpaceChip({ space }: { space: SpaceRow }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(space.name);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        const name = draft.trim();
        if (!name || name === space.name) {
            setEditing(false);
            setDraft(space.name);
            return;
        }
        setPending(true);
        const res = await renameSpace(space.id, name);
        setPending(false);
        if (res.ok) {
            setEditing(false);
            setError(null);
        } else {
            setError(res.error);
        }
    }

    if (editing) {
        return (
            <li className="flex flex-col gap-1">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={save}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") save();
                        if (e.key === "Escape") {
                            setEditing(false);
                            setDraft(space.name);
                            setError(null);
                        }
                    }}
                    disabled={pending}
                    autoFocus
                    aria-label={`Rename ${space.name}`}
                    className="w-40 rounded-full border border-neutral-500 bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-100 focus:outline-none"
                />
                {error && <span className="text-xs text-red-400">{error}</span>}
            </li>
        );
    }

    return (
        <li
            className={`flex items-center rounded-full border border-neutral-700 text-xs text-neutral-300 ${pending ? "opacity-40" : ""}`}
        >
            <button
                type="button"
                onClick={() => {
                    setDraft(space.name);
                    setEditing(true);
                }}
                disabled={pending}
                className="rounded-l-full py-0.5 pl-2.5 pr-1 hover:text-neutral-100 hover:cursor-text"
                aria-label={`Rename ${space.name}`}
            >
                {space.name}
            </button>
            <DeleteButton
                itemName={space.name}
                label="×"
                onDelete={(confirmation) => deleteSpace(space.id, confirmation)}
                triggerClassName="rounded-r-full py-0.5 pl-1 pr-2 text-neutral-500 hover:text-red-400 hover:cursor-pointer"
            >
                <p>Existing work orders keep &ldquo;{space.name}&rdquo; as an area name.</p>
            </DeleteButton>
            {error && <span className="pr-2 text-red-400">{error}</span>}
        </li>
    );
}

function InlineName({
    value,
    onSave,
    className,
    label,
}: {
    value: string;
    onSave: (name: string) => Promise<Result>;
    className: string;
    label: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        const name = draft.trim();
        if (!name || name === value) {
            setEditing(false);
            setDraft(value);
            return;
        }
        setPending(true);
        const res = await onSave(name);
        setPending(false);
        if (res.ok) {
            setEditing(false);
            setError(null);
        } else {
            setError(res.error);
        }
    }

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => {
                    setDraft(value);
                    setEditing(true);
                }}
                className={`${className} rounded px-1 -mx-1 text-left hover:bg-neutral-800 hover:cursor-text`}
                aria-label={`Rename ${value}`}
            >
                {value}
            </button>
        );
    }

    return (
        <span className="flex flex-col gap-1">
            <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") {
                        setEditing(false);
                        setDraft(value);
                        setError(null);
                    }
                }}
                disabled={pending}
                autoFocus
                aria-label={`Edit ${label}`}
                className="rounded border border-neutral-600 bg-neutral-800 px-2 py-0.5 text-sm text-neutral-100 focus:outline-none"
            />
            {error && <span className="text-xs text-red-400">{error}</span>}
        </span>
    );
}

function AddInput({
    placeholder,
    buttonLabel,
    onAdd,
}: {
    placeholder: string;
    buttonLabel: string;
    onAdd: (name: string) => Promise<Result>;
}) {
    const [name, setName] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleAdd() {
        if (!name.trim()) return;
        setPending(true);
        const res = await onAdd(name);
        setPending(false);
        if (res.ok) {
            setName("");
            setError(null);
        } else {
            setError(res.error);
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-2">
                <input
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                    }}
                    placeholder={placeholder}
                    maxLength={100}
                    className={`${inputClass} py-1.5`}
                />
                <button type="button" onClick={handleAdd} disabled={pending || !name.trim()} className={smallButton}>
                    {pending ? "Adding..." : buttonLabel}
                </button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
    );
}
