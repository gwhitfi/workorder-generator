import { describe, expect, it } from "vitest";
import { unitLabel } from "./defaults";

describe("unitLabel", () => {
    it("adds 'Unit' to single-word names", () => {
        expect(unitLabel("B")).toBe("Unit B");
        expect(unitLabel("2B")).toBe("Unit 2B");
        expect(unitLabel("101")).toBe("Unit 101");
    });

    it("shows names with a space as typed", () => {
        expect(unitLabel("Unit A")).toBe("Unit A");
        expect(unitLabel("Apt 101")).toBe("Apt 101");
        expect(unitLabel("Upper Level")).toBe("Upper Level");
    });

    it("ignores surrounding whitespace", () => {
        expect(unitLabel(" B ")).toBe("Unit B");
        expect(unitLabel(" Unit A ")).toBe("Unit A");
    });
});
