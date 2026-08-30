import Link from "next/link";
import { createProperty } from "../actions";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function NewProperty() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }
    return (
        <main>
            <form action={createProperty}>
                <label>
                    Display Name
                    <input name="displayName" required />
                </label>
                <label>
                    Property Type
                    <select name="propertyType" required>
                        <option value="HOUSE">House</option>
                        <option value="DUPLEX">Duplex</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                        <option value="CONDO">Condo</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="LAND">Land</option>
                    </select>
                </label>
                <label>
                    Address
                    <input name="addressLine1" required />
                </label>
                <label>
                    Address (cont)
                    <input name="addressLine2" />
                </label>
                <label>
                    City
                    <input name="city" required />
                </label>
                <label>
                    State <input name="state" required />
                </label>
                <label>
                    Zip Code <input name="zipCode" required />
                </label>
                <label>
                    Notes <textarea name="notes" />
                </label>

                <button type="submit">Save Property</button>
            </form>

            <Link href="/properties">Cancel</Link>
        </main>
    );
}
