import { describe, expect, it } from "vitest";
import { fitWithin, PHOTO_MAX_DIMENSION } from "./resizePhoto";

// resizePhoto itself needs a browser canvas, so only the size math is tested here.
describe("fitWithin", () => {
    it("scales the longest side down to the limit", () => {
        expect(fitWithin(4032, 3024, PHOTO_MAX_DIMENSION)).toEqual({ width: 1600, height: 1200 });
        expect(fitWithin(3024, 4032, PHOTO_MAX_DIMENSION)).toEqual({ width: 1200, height: 1600 });
    });

    it("leaves smaller photos at their size", () => {
        expect(fitWithin(800, 600, PHOTO_MAX_DIMENSION)).toEqual({ width: 800, height: 600 });
        expect(fitWithin(1600, 1600, PHOTO_MAX_DIMENSION)).toEqual({ width: 1600, height: 1600 });
    });

    it("never rounds a side down to zero", () => {
        expect(fitWithin(10000, 1, PHOTO_MAX_DIMENSION)).toEqual({ width: 1600, height: 1 });
    });
});
