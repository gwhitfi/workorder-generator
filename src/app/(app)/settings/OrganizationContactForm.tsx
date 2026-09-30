"use client";

import { useState } from "react";
import { updateOrganization } from "./actions";
import { inputClass } from "@/lib/defaults";

const labelClass = "block text-sm font-medium text-neutral-300 mb-1";

export default function OrganizationContactForm({
    name,
    phone,
    email,
}: {
    name: string;
    phone: string | null;
    email: string | null;
}) {
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setPending(true);
        try {
            await updateOrganization(formData);
            setMessage({ ok: true, text: "Saved." });
        } catch {
            setMessage({ ok: false, text: "Could not save. Try again." });
        } finally {
            setPending(false);
        }
    }

    return (
        <form action={handleSubmit} className="flex flex-col gap-4">
            <label className={labelClass}>
                Organization Name
                <input name="name" defaultValue={name} required className={inputClass} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                    Office Phone
                    <input type="tel" name="phone" defaultValue={phone ?? ""} className={inputClass} />
                </label>
                <label className={labelClass}>
                    Office Email
                    <input type="email" name="email" defaultValue={email ?? ""} className={inputClass} />
                </label>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 hover:cursor-pointer disabled:opacity-40"
                >
                    {pending ? "Saving..." : "Save"}
                </button>
                {message && (
                    <span className={`text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>{message.text}</span>
                )}
            </div>
        </form>
    );
}
