import { describe, expect, it } from "vitest";
import { cancelledEmail } from "./cancelledEmail";
import { escapeHtml } from "./shared";

const organization = { name: "Acme Property", phone: "864-555-0100", email: "office@acme.test" };
const base = {
    organization,
    title: "Fix leaking toilet",
    jobNumber: "2026-1001",
    address: "12 Oak St, Greenville, SC 29601",
};

// Unique per field, so each assertion proves that particular field was escaped.
const hostile = (field: string) => `<b>${field}</b> "Tom" & 'Jerry'`;

describe("cancelledEmail", () => {
    it("builds the subject from the job number, title and address", () => {
        expect(cancelledEmail(base).subject).toBe(
            "Cancelled #2026-1001: Fix leaking toilet — 12 Oak St, Greenville, SC 29601",
        );
    });

    it("escapes user content in the HTML and leaves the text version as-is", () => {
        const fields = {
            title: hostile("title"),
            address: hostile("address"),
            name: hostile("org"),
            phone: hostile("phone"),
            email: hostile("email"),
        };
        const email = cancelledEmail({
            ...base,
            title: fields.title,
            address: fields.address,
            organization: { name: fields.name, phone: fields.phone, email: fields.email },
        });

        for (const value of Object.values(fields)) {
            expect(email.html).not.toContain(value);
            expect(email.html).toContain(escapeHtml(value));
            expect(email.text).toContain(value);
        }
        expect(email.html).not.toContain("<b>");
    });

    it('uses "Work order" when there is no title', () => {
        const email = cancelledEmail({ ...base, title: null });
        expect(email.subject).toContain("Work order");
        expect(email.text).toContain("Work order");
        expect(email.html).toContain("Work order");
    });

    it("lists whichever contact details the organization has", () => {
        const email = cancelledEmail({ ...base, organization: { ...organization, phone: null } });
        expect(email.text).toContain("Questions? Contact Acme Property: office@acme.test");
        expect(email.text).not.toContain("864-555-0100");
    });

    it("leaves out the contact line when there is no phone or email", () => {
        const email = cancelledEmail({ ...base, organization: { ...organization, phone: null, email: null } });
        expect(email.text).not.toContain("Questions?");
        expect(email.html).not.toContain("Questions?");
    });
});
