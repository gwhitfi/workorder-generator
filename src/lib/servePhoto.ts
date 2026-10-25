// Server-only. Builds the response for a photo route once the route has checked access.
import { readFile } from "./storage";

const PRIVATE_HEADERS = {
    // The browser may keep a copy but must ask us before reusing it, so access is checked on every view.
    "Cache-Control": "private, no-cache",
    "X-Content-Type-Options": "nosniff",
};

export function photoNotFound(): Response {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function servePhoto(storageKey: string, request: Request): Promise<Response> {
    const result = await readFile(storageKey, request.headers.get("if-none-match") ?? undefined);
    if (!result) return photoNotFound();

    const headers = { ...PRIVATE_HEADERS, ETag: result.blob.etag };
    if (result.statusCode === 304) return new Response(null, { status: 304, headers });

    return new Response(result.stream, { headers: { ...headers, "Content-Type": result.blob.contentType } });
}
