// Server-only. File storage on a private Vercel Blob store. Files can only be read through our own
// routes, which check access first. Auth comes from the environment: OIDC on Vercel, or
// BLOB_READ_WRITE_TOKEN locally.
import { randomUUID } from "node:crypto";
import { del, get, put, type GetBlobResult } from "@vercel/blob";
import type { PhotoType } from "./photos";

// A new random name per upload, so a replaced photo never reuses a cached file.
export function lineItemPhotoKey(organizationId: string, lineItemId: string, type: PhotoType): string {
    return `org/${organizationId}/line-items/${lineItemId}/${randomUUID()}.${type.extension}`;
}

export async function uploadFile(storageKey: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await put(storageKey, Buffer.from(bytes), { access: "private", contentType });
}

// Returns null if the file doesn't exist. Pass the browser's If-None-Match to get a 304 for an unchanged file.
export function readFile(storageKey: string, ifNoneMatch?: string): Promise<GetBlobResult | null> {
    return get(storageKey, { access: "private", ifNoneMatch });
}

// Runs after the database rows are gone, so a failure is logged instead of failing the action.
// A file left behind costs a little storage but can't be read, since no row points to it.
export async function deleteFiles(storageKeys: string[]): Promise<void> {
    if (storageKeys.length === 0) return;
    try {
        await del(storageKeys);
    } catch (error) {
        console.error(`Failed to delete ${storageKeys.length} stored file(s)`, error);
    }
}
