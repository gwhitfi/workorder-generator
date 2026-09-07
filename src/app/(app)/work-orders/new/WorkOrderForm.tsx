"use client";

import { useState } from "react";
import { createWorkOrder } from "../actions";
import { inputClass, labelClass } from "@/lib/defaults";

type UnitOption = { id: string; name: string };
type PropertyOption = {
    id: string;
    displayName: string;
    units: UnitOption[];
};
type ContactOption = {
    id: string;
    displayName: string;
    company: string | null;
};
type TenantOption = {
    id: string;
    displayName: string;
    unitId: string | null;
};
export default function WorkOrderForm({
    properties,
    contractors,
    tenants,
}: {
    properties: PropertyOption[];
    contractors: ContactOption[];
    tenants: TenantOption[];
}) {
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedContractor, setSelectedContractor] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const units = properties.find((p) => p.id === selectedProperty)?.units ?? [];
    const selectedUnitId = units.length === 1 ? units[0].id : selectedUnit;
    const tenant = tenants.find((t) => t.unitId === selectedUnitId);
    const [contactTenant, setContactTenant] = useState(false);
    return (
        <form action={createWorkOrder} autoComplete="off" className="flex flex-col gap-4">
            <label className={labelClass}>
                Work Order Title
                <input name="title" required className={inputClass} />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                    Select a property
                    <select
                        name="propertyId"
                        required
                        className={inputClass}
                        value={selectedProperty}
                        onChange={(e) => {
                            setSelectedProperty(e.target.value);
                            setSelectedUnit("");
                        }}
                    >
                        <option value="">Select a property</option>
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.displayName}
                            </option>
                        ))}
                    </select>
                </label>
                {units.length > 1 && (
                    <label className={labelClass}>
                        Unit
                        <select
                            name="unitId"
                            required
                            className={inputClass}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            <option value="">Select a unit</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
            <label className={labelClass}>
                Select a contractor
                <select
                    name="contractorId"
                    className={inputClass}
                    value={selectedContractor}
                    onChange={(e) => setSelectedContractor(e.target.value)}
                >
                    <option value="">Assign later</option>
                    {contractors.map((contractor) => (
                        <option key={contractor.id} value={contractor.id}>
                            {contractor.displayName}
                            {contractor.company ? ` — ${contractor.company}` : ""}
                        </option>
                    ))}
                </select>
            </label>
            {units.length === 1 && <input type="hidden" name="unitId" value={units[0].id} />}
            <label className={labelClass}>
                Notes <textarea name="notes" className={inputClass} />
            </label>
            <label className={labelClass}>
                Due date
                <input type="date" name="dueDate" className={inputClass} />
            </label>
            <label className={labelClass}>
                Send notification to tenant?{" "}
                <input
                    name="tenant"
                    type="checkbox"
                    checked={contactTenant}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900"
                    onChange={(e) => setContactTenant(e.target.checked)}
                />
            </label>
            {contactTenant &&
                (tenant ? (
                    <p className="text-sm text-neutral-400">Notification will go to {tenant.displayName}.</p>
                ) : (
                    <p className="text-sm text-amber-400">No tenant on file for this unit.</p>
                ))}
            <button
                type="submit"
                className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100  hover:cursor-pointer"
            >
                Save Work Order
            </button>
        </form>
    );
}
