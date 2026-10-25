import { describe, expect, it } from "vitest";
import { completeInput, noteInput, photoInput, toggleInput } from "./schemas";

const token = "abc123";
const lineItemId = "cl0000000000000000000000";

describe("toggleInput", () => {
    it("accepts a token and line item ID", () => {
        expect(toggleInput.parse({ token, lineItemId })).toEqual({ token, lineItemId });
    });

    it("rejects an empty or over-long token", () => {
        expect(toggleInput.safeParse({ token: "", lineItemId }).success).toBe(false);
        expect(toggleInput.safeParse({ token: "x".repeat(101), lineItemId }).success).toBe(false);
    });

    it("rejects an empty or over-long line item ID", () => {
        expect(toggleInput.safeParse({ token, lineItemId: "" }).success).toBe(false);
        expect(toggleInput.safeParse({ token, lineItemId: "x".repeat(101) }).success).toBe(false);
    });

    it("rejects non-string values", () => {
        expect(toggleInput.safeParse({ token: 123, lineItemId }).success).toBe(false);
        expect(toggleInput.safeParse({ token, lineItemId: null }).success).toBe(false);
    });
});

describe("noteInput", () => {
    it("trims the note", () => {
        expect(noteInput.parse({ token, lineItemId, note: "  Replaced the valve  " }).note).toBe(
            "Replaced the valve",
        );
    });

    it("turns an empty or blank note into null", () => {
        expect(noteInput.parse({ token, lineItemId, note: "" }).note).toBeNull();
        expect(noteInput.parse({ token, lineItemId, note: "   \n " }).note).toBeNull();
    });

    it("accepts 2000 characters and rejects 2001", () => {
        expect(noteInput.parse({ token, lineItemId, note: "x".repeat(2000) }).note).toHaveLength(2000);
        expect(noteInput.safeParse({ token, lineItemId, note: "x".repeat(2001) }).success).toBe(false);
    });

    it("rejects a non-string note", () => {
        expect(noteInput.safeParse({ token, lineItemId, note: 42 }).success).toBe(false);
    });
});

describe("completeInput", () => {
    it("trims completion notes and turns blank ones into null", () => {
        expect(completeInput.parse({ token, completionNotes: " All done " }).completionNotes).toBe("All done");
        expect(completeInput.parse({ token, completionNotes: "  " }).completionNotes).toBeNull();
    });

    it("rejects completion notes over 2000 characters", () => {
        expect(completeInput.safeParse({ token, completionNotes: "x".repeat(2001) }).success).toBe(false);
    });
});

describe("photoInput", () => {
    it("accepts a token and attachment ID", () => {
        expect(photoInput.parse({ token, attachmentId: lineItemId })).toEqual({ token, attachmentId: lineItemId });
    });

    it("rejects an empty or over-long token or attachment ID", () => {
        expect(photoInput.safeParse({ token: "", attachmentId: lineItemId }).success).toBe(false);
        expect(photoInput.safeParse({ token, attachmentId: "" }).success).toBe(false);
        expect(photoInput.safeParse({ token, attachmentId: "x".repeat(101) }).success).toBe(false);
    });
});
