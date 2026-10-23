import { describe, expect, it } from "vitest";
import { formatPhone } from "./phone";

describe("formatPhone", () => {
    it("formats 10 digits", () => {
        expect(formatPhone("5551234567")).toBe("(555) 123-4567");
    });

    it("reformats numbers with punctuation", () => {
        expect(formatPhone("555-123-4567")).toBe("(555) 123-4567");
        expect(formatPhone("555.123.4567")).toBe("(555) 123-4567");
        expect(formatPhone("(555) 123-4567")).toBe("(555) 123-4567");
    });

    it("drops a leading +1", () => {
        expect(formatPhone("+1 555 123 4567")).toBe("(555) 123-4567");
        expect(formatPhone("15551234567")).toBe("(555) 123-4567");
    });

    it("returns anything that isn't a 10-digit number unchanged", () => {
        expect(formatPhone("123")).toBe("123");
        expect(formatPhone("25551234567")).toBe("25551234567");
        expect(formatPhone("555-123-4567 ext. 5")).toBe("555-123-4567 ext. 5");
        expect(formatPhone("")).toBe("");
    });
});
