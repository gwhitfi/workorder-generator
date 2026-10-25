import { beforeEach, describe, expect, it, vi } from "vitest";

// Never talk to the real store from tests.
vi.mock("@vercel/blob", () => ({ put: vi.fn(), get: vi.fn(), del: vi.fn() }));

import { del, get, put } from "@vercel/blob";
import { deleteFiles, lineItemPhotoKey, readFile, uploadFile } from "./storage";

const jpeg = { mimeType: "image/jpeg", extension: "jpg" } as const;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("lineItemPhotoKey", () => {
    it("files photos under the organization and line item with a random name", () => {
        const key = lineItemPhotoKey("org1", "item1", jpeg);
        expect(key).toMatch(/^org\/org1\/line-items\/item1\/[0-9a-f-]{36}\.jpg$/);
        expect(lineItemPhotoKey("org1", "item1", jpeg)).not.toBe(key);
    });
});

describe("uploadFile and readFile", () => {
    it("always use private access", async () => {
        await uploadFile("org/org1/a.jpg", new Uint8Array([1, 2, 3]), "image/jpeg");
        expect(put).toHaveBeenCalledWith("org/org1/a.jpg", expect.any(Buffer), {
            access: "private",
            contentType: "image/jpeg",
        });

        await readFile("org/org1/a.jpg", '"etag"');
        expect(get).toHaveBeenCalledWith("org/org1/a.jpg", { access: "private", ifNoneMatch: '"etag"' });
    });
});

describe("deleteFiles", () => {
    it("does nothing for an empty list", async () => {
        await deleteFiles([]);
        expect(del).not.toHaveBeenCalled();
    });

    it("logs a failure instead of throwing", async () => {
        vi.mocked(del).mockRejectedValueOnce(new Error("store unavailable"));
        const log = vi.spyOn(console, "error").mockImplementation(() => {});

        await expect(deleteFiles(["a.jpg", "b.jpg"])).resolves.toBeUndefined();
        expect(del).toHaveBeenCalledWith(["a.jpg", "b.jpg"]);
        expect(log).toHaveBeenCalledOnce();

        log.mockRestore();
    });
});
