import type { Prisma, WorkOrderStatus } from "@/generated/prisma/client";
import { todayInAppTimeZone } from "@/lib/dates";
import { streetSortKey, type SortColumns } from "@/lib/sorting";

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
    archived: { label: "Archived", where: (): Prisma.WorkOrderWhereInput => ({ archived: true }) },
} as const;

export type WorkOrderFilter = keyof typeof WORK_ORDER_FILTERS;

// The "Split view by status" setting on /work-orders, saved per browser: "1" on, "0" off.
export const SPLIT_VIEW_COOKIE = "wo-split-view";

export function isWorkOrderFilter(value: unknown): value is WorkOrderFilter {
    return typeof value === "string" && Object.hasOwn(WORK_ORDER_FILTERS, value);
}

export const STATUS_ORDER: WorkOrderStatus[] = ["DRAFT", "SENT", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"];

type SortableWorkOrder = {
    title: string;
    status: WorkOrderStatus;
    dueDate: Date | null;
    contractorName: string | null;
    // Only loaded where the list can sort by contractor; without it, the name on the work order is used.
    contractor?: { firstName: string | null; lastName: string | null } | null;
    property: { addressLine1: string };
    unit: { name: string; isDefault: boolean } | null;
};

export type WorkOrderSort = "title" | "status" | "due" | "property" | "contractor";

export const WORK_ORDER_SORTS: SortColumns<SortableWorkOrder, WorkOrderSort> = {
    title: { value: (wo) => wo.title },
    status: { value: (wo) => STATUS_ORDER.indexOf(wo.status) },
    due: { value: (wo) => wo.dueDate, firstDir: "desc" },
    property: {
        value: (wo) => [
            ...streetSortKey(wo.property.addressLine1),
            wo.unit && !wo.unit.isDefault ? wo.unit.name : null,
        ],
    },
    contractor: {
        value: (wo) =>
            wo.contractor?.lastName?.trim()
                ? [wo.contractor.lastName, wo.contractor.firstName]
                : [wo.contractorName, null],
    },
};

type AddressProperty = { addressLine1: string; city: string; state: string; zipCode: string };
type AddressUnit = { name: string; isDefault: boolean } | null;

export function formatWorkOrderAddress(property: AddressProperty, unit: AddressUnit) {
    return (
        `${property.addressLine1}${unit && !unit.isDefault ? `, Unit ${unit.name}` : ""}, ` +
        `${property.city}, ${property.state} ${property.zipCode}`
    );
}
