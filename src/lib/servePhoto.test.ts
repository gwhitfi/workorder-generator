import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ readFile: vi.fn() }));

import { readFile } from "./storage";
import { photoNotFound, servePhoto } from "./servePhoto";

const blobBase = {
    url: "",
    downloadUrl: "",
    pathname: "a.jpg",
    contentDisposition: "",
    cacheControl: "",
    uploadedAt: new Date(),
    etag: '"abc"',
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("servePhoto", () => {
    it("streams the photo with private caching headers", async () => {
        vi.mocked(readFile).mockResolvedValueOnce({
            statusCode: 200,
            stream: new Blob([new Uint8Array([1, 2, 3])]).stream(),
            headers: new Headers(),
            blob: { ...blobBase, contentType: "image/jpeg", size: 3 },
        });

        const response = await servePhoto("a.jpg", new Request("http://localhost/photo"));

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/jpeg");
        expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("ETag")).toBe('"abc"');
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("passes the browser's ETag through and returns 304 when unchanged", async () => {
        vi.mocked(readFile).mockResolvedValueOnce({
            statusCode: 304,
            stream: null,
            headers: new Headers(),
            blob: { ...blobBase, contentType: null, size: null },
        });

        const request = new Request("http://localhost/photo", { headers: { "If-None-Match": '"abc"' } });
        const response = await servePhoto("a.jpg", request);

        expect(readFile).toHaveBeenCalledWith("a.jpg", '"abc"');
        expect(response.status).toBe(304);
        expect(response.headers.get("Cache-Control")).toBe("private, no-cache");
    });

    it("returns 404 when the file is missing", async () => {
        vi.mocked(readFile).mockResolvedValueOnce(null);

        const response = await servePhoto("a.jpg", new Request("http://localhost/photo"));

        expect(response.status).toBe(404);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
});

describe("photoNotFound", () => {
    it("is a 404 that isn't cached", () => {
        const response = photoNotFound();
        expect(response.status).toBe(404);
        expect(response.headers.get("Cache-Control")).toBe("no-store");
    });
});
