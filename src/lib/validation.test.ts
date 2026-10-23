import { describe, expect, it } from "vitest";
import { optionalEmail, optionalPhone } from "./validation";

describe("optionalPhone", () => {
    it("turns empty or missing into null", () => {
        expect(optionalPhone.parse("")).toBeNull();
        expect(optionalPhone.parse(undefined)).toBeNull();
    });

    it("strips formatting down to 10 digits", () => {
        expect(optionalPhone.parse("(555) 123-4567")).toBe("5551234567");
        expect(optionalPhone.parse("+1 555 123 4567")).toBe("5551234567");
    });

    it("rejects too few or too many digits with the phone message", () => {
        const result = optionalPhone.safeParse("123-4567");
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Enter a 10-digit phone number");
        expect(optionalPhone.safeParse("25551234567").success).toBe(false);
    });
});

describe("optionalEmail", () => {
    it("turns empty, blank or missing into null", () => {
        expect(optionalEmail.parse("")).toBeNull();
        expect(optionalEmail.parse("   ")).toBeNull();
        expect(optionalEmail.parse(undefined)).toBeNull();
    });

    it("trims a valid email", () => {
        expect(optionalEmail.parse("  office@example.com ")).toBe("office@example.com");
    });

    it("rejects a malformed email", () => {
        const result = optionalEmail.safeParse("not-an-email");
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe("Invalid email address");
    });
});
