import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { STATUS_COLORS, WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { List, ListHeader, ListRow, Cell } from "@/components/list/List";

const COLS = "sm:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.8fr)_minmax(0,1.2fr)]";
const OPEN_STATUSES = ["DRAFT", "SENT", "IN_PROGRESS"];

export default async function WorkOrder() {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const workOrders = await prisma.workOrder.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
        },
        orderBy: { createdAt: "desc" },
        include: {
            property: true,
            unit: true,
        },
    });

    const now = new Date();

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <PageHeader
                title="Work Orders"
                subtitle={`${workOrders.length} ${workOrders.length === 1 ? "work order" : "work orders"}`}
                actionHref="/work-orders/new"
                actionLabel="Add Work Order"
            />

            {workOrders.length === 0 ? (
                <EmptyState
                    message="No work orders added yet."
                    actionHref="/work-orders/new"
                    actionLabel="Create your first work order"
                />
            ) : (
                <List>
                    <ListHeader cols={COLS} labels={["Title", "Status", "Due", "Property", "Contractor"]} />
                    {workOrders.map((workOrder) => {
                        const overdue =
                            workOrder.dueDate && workOrder.dueDate < now && OPEN_STATUSES.includes(workOrder.status);

                        return (
                            <ListRow
                                key={workOrder.id}
                                href={`/work-orders/${workOrder.id}`}
                                label={`View ${workOrder.title ?? "untitled work order"}`}
                                cols={COLS}
                            >
                                <Cell className="basis-full truncate font-medium">
                                    {workOrder.title ?? <span className="italic text-neutral-500">Untitled work order</span>}
                                </Cell>
                                <Cell>
                                    <span
                                        className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[workOrder.status]}`}
                                    >
                                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                                    </span>
                                </Cell>
                                <Cell className={overdue ? "text-red-400" : "text-neutral-400"}>
                                    {workOrder.dueDate && (
                                        <>
                                            <span className="sm:hidden">Due </span>
                                            {workOrder.dueDate.toLocaleDateString()}
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
                    })}
                </List>
            )}
        </main>
    );
}
