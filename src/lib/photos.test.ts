import { describe, expect, it } from "vitest";
import { checkPhoto, detectPhotoType, MAX_PHOTO_BYTES } from "./photos";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const webp = new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ");

describe("detectPhotoType", () => {
    it("recognizes JPEG, PNG and WebP from their first bytes", () => {
        expect(detectPhotoType(jpeg)).toEqual({ mimeType: "image/jpeg", extension: "jpg" });
        expect(detectPhotoType(png)).toEqual({ mimeType: "image/png", extension: "png" });
        expect(detectPhotoType(webp)).toEqual({ mimeType: "image/webp", extension: "webp" });
    });

    it("rejects other files, including ones too short to check", () => {
        expect(detectPhotoType(new TextEncoder().encode("GIF89a"))).toBeNull();
        expect(detectPhotoType(new TextEncoder().encode("<svg xmlns="))).toBeNull();
        expect(detectPhotoType(new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WAVE"))).toBeNull();
        expect(detectPhotoType(new Uint8Array([0xff, 0xd8]))).toBeNull();
    });
});

describe("checkPhoto", () => {
    it("accepts a supported photo", () => {
        expect(checkPhoto(jpeg)).toEqual({ ok: true, type: { mimeType: "image/jpeg", extension: "jpg" } });
    });

    it("rejects an empty file", () => {
        expect(checkPhoto(new Uint8Array())).toEqual({ ok: false, error: "Choose a photo." });
    });

    it("rejects files over 3 MB", () => {
        const atLimit = new Uint8Array(MAX_PHOTO_BYTES);
        atLimit.set(jpeg);
        expect(checkPhoto(atLimit).ok).toBe(true);

        const tooBig = new Uint8Array(MAX_PHOTO_BYTES + 1);
        tooBig.set(jpeg);
        expect(checkPhoto(tooBig)).toEqual({ ok: false, error: "Photos must be 3 MB or smaller." });
    });

    it("rejects a file whose bytes aren't a supported image", () => {
        const pdf = new TextEncoder().encode("%PDF-1.7");
        expect(checkPhoto(pdf)).toEqual({ ok: false, error: "Use a JPEG, PNG or WebP photo." });
    });
});
