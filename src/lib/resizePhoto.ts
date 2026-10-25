// Browser-only. Shrinks a photo before upload so it fits the Server Action size limit and loads quickly.
import { MAX_PHOTO_BYTES } from "./photos";

export const PHOTO_MAX_DIMENSION = 1600;
const JPEG_QUALITIES = [0.85, 0.7, 0.5];

// Scales the longest side down to `max`, keeping the aspect ratio. Smaller photos are left as they are.
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
    const scale = Math.min(1, max / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class UnreadablePhotoError extends Error {}

export async function resizePhoto(file: File): Promise<File> {
    let bitmap: ImageBitmap;
    try {
        // from-image applies the camera's rotation, so phone photos aren't sideways.
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
        throw new UnreadablePhotoError("This browser can't read that photo.");
    }

    const { width, height } = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");

    // JPEG has no transparency; without this, transparent PNG areas turn black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    for (const quality of JPEG_QUALITIES) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= MAX_PHOTO_BYTES) return new File([blob], "photo.jpg", { type: "image/jpeg" });
    }
    throw new UnreadablePhotoError("That photo is too large, even after shrinking it.");
}
