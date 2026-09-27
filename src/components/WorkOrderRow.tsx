import type { Prisma } from "@/generated/prisma/client";
import { STATUS_COLORS, WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import { isOverdue } from "@/lib/workOrders";
import { List, ListHeader, ListRow, Cell } from "@/components/list/List";
import { formatDueDate } from "@/lib/dates";

export type WorkOrderWithPlace = Prisma.WorkOrderGetPayload<{ include: { property: true; unit: true } }>;

const COLS = "sm:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.8fr)_minmax(0,1.2fr)]";

export function WorkOrderList({ workOrders }: { workOrders: WorkOrderWithPlace[] }) {
    return (
        <List>
            <ListHeader cols={COLS} labels={["Title", "Status", "Due", "Property", "Contractor"]} />
            {workOrders.map((workOrder) => (
                <WorkOrderRow key={workOrder.id} workOrder={workOrder} />
            ))}
        </List>
    );
}

export default function WorkOrderRow({ workOrder }: { workOrder: WorkOrderWithPlace }) {
    const overdue = isOverdue(workOrder);

    return (
        <ListRow
            href={`/work-orders/${workOrder.id}`}
            label={`View ${workOrder.title ?? "untitled work order"}`}
            cols={COLS}
        >
            <Cell className="basis-full truncate font-medium">
                {workOrder.title ?? <span className="italic text-neutral-500">Untitled work order</span>}
            </Cell>
            <Cell>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[workOrder.status]}`}>
                    {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                </span>
            </Cell>
            <Cell className={overdue ? "text-red-400" : "text-neutral-400"}>
                {workOrder.dueDate && (
                    <>
                        <span className="sm:hidden">Due </span>
                        {formatDueDate(workOrder.dueDate)}
                        {overdue && <span className="sm:hidden"> · Overdue</span>}
                    </>
                )}
            </Cell>
            <Cell className="basis-full truncate text-neutral-400">
                {workOrder.property.addressLine1}
                {workOrder.unit && !workOrder.unit.isDefault && `, Unit ${workOrder.unit.name}`}
            </Cell>
            <Cell className="basis-full truncate text-neutral-400">{workOrder.contractorName}</Cell>
        </ListRow>
    );
}
