import { describe, expect, it } from "vitest";
import { isDeleteConfirmed } from "./confirmDelete";

describe("isDeleteConfirmed", () => {
    it("accepts yes in any case, with surrounding whitespace", () => {
        expect(isDeleteConfirmed("yes")).toBe(true);
        expect(isDeleteConfirmed("Yes")).toBe(true);
        expect(isDeleteConfirmed(" YES ")).toBe(true);
    });

    it("rejects anything else", () => {
        expect(isDeleteConfirmed("")).toBe(false);
        expect(isDeleteConfirmed("y")).toBe(false);
        expect(isDeleteConfirmed("yes please")).toBe(false);
        expect(isDeleteConfirmed("no")).toBe(false);
    });
});
