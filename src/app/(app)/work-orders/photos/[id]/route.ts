import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { photoNotFound, servePhoto } from "@/lib/servePhoto";

// Office view of a photo. Layouts don't protect Route Handlers, so access is checked here.
// The URL has no file extension on purpose: the proxy skips Clerk for paths ending in .jpg/.png/.webp.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    const result = await getCurrentUser();
    if (result.state !== "ready") return photoNotFound();

    const { id: rawId } = await params;
    const id = z.string().min(1).max(100).safeParse(rawId);
    if (!id.success) return photoNotFound();

    const attachment = await prisma.attachment.findFirst({
        where: { id: id.data, organizationId: result.organization.id },
        select: { storageKey: true },
    });
    if (!attachment) return photoNotFound();

    return servePhoto(attachment.storageKey, request);
}
