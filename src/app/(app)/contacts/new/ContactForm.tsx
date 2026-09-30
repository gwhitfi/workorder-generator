"use client";
import { useState } from "react";
import { createContact } from "../actions";
import { CONTACT_TYPE_LABELS } from "@/lib/defaults";

type UnitOption = { id: string; name: string };
type PropertyOption = {
    id: string;
    displayName: string;
    units: UnitOption[];
};

export type ContactFormValues = {
    contactType: string;
    displayName: string;
    firstName: string;
    lastName: string;
    company: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    notes: string;
    propertyId: string;
    unitId: string;
};

export default function ContactForm({
    properties,
    initial,
    action = createContact,
    submitLabel = "Save Contact",
    lockType = false,
}: {
    properties: PropertyOption[];
    initial?: ContactFormValues;
    action?: (formData: FormData) => void | Promise<void>;
    submitLabel?: string;
    lockType?: boolean;
}) {
    const editing = !!initial;
    const [contactType, setContactType] = useState(initial?.contactType ?? "CONTRACTOR");
    const [selectedProperty, setSelectedProperty] = useState(initial?.propertyId ?? "");
    const units = properties.find((p) => p.id === selectedProperty)?.units ?? [];
    const inputClass =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
        "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

    const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

    return (
        <form action={action} autoComplete="off" className="flex flex-col gap-4">
            <label className={labelClass}>
                Display Name
                <input name="displayName" required defaultValue={initial?.displayName} className={inputClass} />
            </label>
            <label className={labelClass}>
                Contact Type
                <select
                    name={lockType ? undefined : "contactType"}
                    required
                    disabled={lockType}
                    className={`${inputClass} disabled:opacity-60`}
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value)}
                >
                    {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                {lockType && (
                    <>
                        <input type="hidden" name="contactType" value={contactType} />
                        <span className="mt-1 block text-xs font-normal text-neutral-500">
                            Locked because this contact is on work orders.
                        </span>
                    </>
                )}
            </label>
            <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                    First Name
                    <input name="firstName" defaultValue={initial?.firstName} className={inputClass} />
                </label>
                <label className={labelClass}>
                    Last Name
                    <input name="lastName" defaultValue={initial?.lastName} className={inputClass} />
                </label>
            </div>
            {contactType !== "TENANT" && (
                <div className="flex flex-col gap-4">
                    <label className={labelClass}>
                        Company
                        <input name="company" defaultValue={initial?.company} className={inputClass} />
                    </label>
                    <label className={labelClass}>
                        Address
                        <input name="addressLine1" defaultValue={initial?.addressLine1} className={inputClass} />
                    </label>
                    <label className={labelClass}>
                        Address (cont)
                        <input name="addressLine2" defaultValue={initial?.addressLine2} className={inputClass} />
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                        <label className="col-span-3 block">
                            <span className={labelClass}>City</span>
                            <input name="city" defaultValue={initial?.city} className={inputClass} />
                        </label>

                        <label className="col-span-1 block">
                            <span className={labelClass}>State</span>
                            <input name="state" maxLength={2} defaultValue={initial?.state} className={inputClass} />
                        </label>

                        <label className="col-span-2 block">
                            <span className={labelClass}>Zip code</span>
                            <input name="zipCode" defaultValue={initial?.zipCode} className={inputClass} />
                        </label>
                    </div>
                </div>
            )}
            {contactType === "TENANT" && (
                <div className="flex flex-col gap-4">
                    <label className={labelClass}>
                        Property
                        <select
                            name="propertyId"
                            required={!editing}
                            className={inputClass}
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                        >
                            <option value="">{editing ? "No property" : "Select a property"}</option>
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
                                key={selectedProperty}
                                name="unitId"
                                required
                                defaultValue={selectedProperty === initial?.propertyId ? initial.unitId : ""}
                                className={inputClass}
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
                    {units.length === 1 && <input type="hidden" name="unitId" value={units[0].id} />}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>
                    Phone Number
                    <input type="tel" name="phone" required defaultValue={initial?.phone} className={inputClass} />
                </label>
                <label className={labelClass}>
                    Email
                    <input type="email" name="email" required defaultValue={initial?.email} className={inputClass} />
                </label>
            </div>
            <label className={labelClass}>
                Notes <textarea name="notes" defaultValue={initial?.notes} className={inputClass} />
            </label>
            <button
                type="submit"
                className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100  hover:cursor-pointer"
            >
                {submitLabel}
            </button>
        </form>
    );
}
