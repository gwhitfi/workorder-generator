import Link from "next/link";
import { createProperty } from "../actions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PropertyForm from "./PropertyForm";

export default async function NewProperty() {
    const inputClass =
        "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
        "placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400";

    const labelClass = "block text-sm font-medium text-neutral-300 mb-1";
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }
    return (
        <main className="mx-auto max-w-2xl px-4 py-10 text-neutral-100">
            <h1 className="text-2xl font-semibold mb-6">Add a property</h1>
            <form action={createProperty} className="flex flex-col gap-4">
                <label className={labelClass}>
                    Display Name
                    <input name="displayName" required className={inputClass} />
                </label>
                <label className={labelClass}>
                    Property Type
                    <select name="propertyType" required className={inputClass}>
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

                <PropertyForm />
                <button
                    type="submit"
                    className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Save Property
                </button>
            </form>
            <Link href="/properties" className="text-sm text-neutral-400 hover:text-neutral-100">
                Cancel
            </Link>
        </main>
    );
}
