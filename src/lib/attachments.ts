// Server-only. Deleting rows cascades to their Attachment rows but not to the stored files, so delete actions
// collect the storage keys first and pass them to deleteFiles() once the database delete has succeeded.
import type { Prisma } from "@/generated/prisma/client";
import prisma from "./prisma";

export async function attachmentKeys(organizationId: string, where: Prisma.AttachmentWhereInput): Promise<string[]> {
    const attachments = await prisma.attachment.findMany({
        where: { ...where, organizationId },
        select: { storageKey: true },
    });
    return attachments.map((a) => a.storageKey);
}

// Photos on a work order itself or on any of its line items.
export function onWorkOrders(workOrder: Prisma.WorkOrderWhereInput): Prisma.AttachmentWhereInput {
    return { OR: [{ workOrder }, { lineItem: { area: { workOrder } } }] };
}
