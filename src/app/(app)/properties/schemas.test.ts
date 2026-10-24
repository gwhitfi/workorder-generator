import { describe, expect, it } from "vitest";
import { z } from "zod";
import { propertyInput, unitsInput } from "./schemas";

const house = {
    propertyType: "HOUSE",
    displayName: "Maple House",
    addressLine1: "12 Maple St",
    city: "Charleston",
    state: "SC",
    zipCode: "29401",
};

describe("propertyInput", () => {
    it("accepts a property with only the required fields", () => {
        const result = propertyInput.parse(house);
        expect(result.displayName).toBe("Maple House");
        expect(result.addressLine2).toBeNull();
        expect(result.notes).toBeNull();
    });

    it("trims text and uppercases the state", () => {
        const result = propertyInput.parse({ ...house, displayName: "  Maple House ", state: "sc" });
        expect(result.displayName).toBe("Maple House");
        expect(result.state).toBe("SC");
    });

    it("rejects an unknown property type", () => {
        expect(propertyInput.safeParse({ ...house, propertyType: "CASTLE" }).success).toBe(false);
    });

    it("reports a message for each blank required field", () => {
        const blank = { propertyType: "HOUSE", displayName: " ", addressLine1: "", city: "", state: "", zipCode: "" };
        const result = propertyInput.safeParse(blank);
        expect(result.success).toBe(false);
        expect(z.flattenError(result.error!).fieldErrors).toEqual({
            displayName: ["Enter a name"],
            addressLine1: ["Enter an address"],
            city: ["Enter a city"],
            state: ["Choose a state"],
            zipCode: ["Enter a zip code"],
        });
    });

    it("enforces length limits", () => {
        expect(propertyInput.safeParse({ ...house, displayName: "a".repeat(100) }).success).toBe(true);
        const result = propertyInput.safeParse({ ...house, displayName: "a".repeat(101) });
        expect(result.error?.issues[0].message).toBe("Use 100 characters or fewer");
        expect(propertyInput.safeParse({ ...house, notes: "a".repeat(5000) }).success).toBe(true);
        expect(propertyInput.safeParse({ ...house, notes: "a".repeat(5001) }).success).toBe(false);
    });
});

describe("unitsInput", () => {
    it("treats missing or empty as no units", () => {
        expect(unitsInput.parse(undefined)).toEqual([]);
        expect(unitsInput.parse("")).toEqual([]);
        expect(unitsInput.parse("[]")).toEqual([]);
    });

    it("reads and trims unit names", () => {
        expect(unitsInput.parse(JSON.stringify([{ name: " Unit A " }, { name: "Unit B" }]))).toEqual([
            { name: "Unit A" },
            { name: "Unit B" },
        ]);
    });

    it("rejects malformed JSON with a message instead of throwing", () => {
        const result = unitsInput.safeParse("[{name:");
        expect(result.error?.issues[0].message).toBe("The unit list couldn't be read. Try again.");
    });

    it("rejects the wrong shape, blank names and long names", () => {
        expect(unitsInput.safeParse('{"name":"Unit A"}').success).toBe(false);
        expect(unitsInput.safeParse(JSON.stringify([{ name: "  " }])).success).toBe(false);
        expect(unitsInput.safeParse(JSON.stringify([{ name: "a".repeat(101) }])).success).toBe(false);
    });

    it("rejects duplicate names regardless of case", () => {
        const result = unitsInput.safeParse(JSON.stringify([{ name: "Unit A" }, { name: "unit a" }]));
        expect(result.error?.issues[0].message).toBe('"unit a" has already been added.');
    });

    it("rejects more than 500 units", () => {
        const units = (count: number) => JSON.stringify(Array.from({ length: count }, (_, i) => ({ name: `${i}` })));
        expect(unitsInput.safeParse(units(500)).success).toBe(true);
        expect(unitsInput.safeParse(units(501)).success).toBe(false);
    });
});
