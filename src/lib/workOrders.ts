import type { Prisma, WorkOrderStatus } from "@/generated/prisma/client";
import { todayInAppTimeZone } from "@/lib/dates";

export const OPEN_STATUSES: WorkOrderStatus[] = ["DRAFT", "SENT", "IN_PROGRESS"];

export function isOverdue(workOrder: { status: WorkOrderStatus; dueDate: Date | null }) {
    return !!workOrder.dueDate && workOrder.dueDate < todayInAppTimeZone() && OPEN_STATUSES.includes(workOrder.status);
}

export const WORK_ORDER_FILTERS = {
    draft: { label: "Drafts", where: (): Prisma.WorkOrderWhereInput => ({ status: "DRAFT" }) },
    active: {
        label: "With contractor",
        where: (): Prisma.WorkOrderWhereInput => ({ status: { in: ["SENT", "IN_PROGRESS"] } }),
    },
    completed: { label: "To review", where: (): Prisma.WorkOrderWhereInput => ({ status: "COMPLETED" }) },
    overdue: {
        label: "Overdue",
        where: (): Prisma.WorkOrderWhereInput => ({
            status: { in: OPEN_STATUSES },
            dueDate: { lt: todayInAppTimeZone() },
        }),
    },
    closed: { label: "Closed", where: (): Prisma.WorkOrderWhereInput => ({ status: "CLOSED" }) },
    // Lists hide archived work orders by default; this filter overrides that.
    archived: { label: "Archived", where: (): Prisma.WorkOrderWhereInput => ({ archived: true }) },
} as const;

export type WorkOrderFilter = keyof typeof WORK_ORDER_FILTERS;

export function isWorkOrderFilter(value: unknown): value is WorkOrderFilter {
    return typeof value === "string" && value in WORK_ORDER_FILTERS;
}
