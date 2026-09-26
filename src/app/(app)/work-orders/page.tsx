import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { WorkOrderList } from "@/components/WorkOrderRow";
import { WORK_ORDER_FILTERS, isWorkOrderFilter, type WorkOrderFilter } from "@/lib/workOrders";

export default async function WorkOrder({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const { status } = await searchParams;
    const filter = isWorkOrderFilter(status) ? status : null;

    const workOrders = await prisma.workOrder.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
            ...(filter ? WORK_ORDER_FILTERS[filter].where() : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
            property: true,
            unit: true,
        },
    });

    const noun = workOrders.length === 1 ? "work order" : "work orders";

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <PageHeader
                title="Work Orders"
                subtitle={`${workOrders.length} ${noun}`}
                actionHref="/work-orders/new"
                actionLabel="Add Work Order"
            />

            <FilterChips active={filter} />

            {workOrders.length === 0 ? (
                filter ? (
                    <EmptyState
                        message="No work orders match this filter."
                        actionHref="/work-orders"
                        actionLabel="Show all work orders"
                    />
                ) : (
                    <EmptyState
                        message="No work orders added yet."
                        actionHref="/work-orders/new"
                        actionLabel="Create your first work order"
                    />
                )
            ) : (
                <WorkOrderList workOrders={workOrders} />
            )}
        </main>
    );
}

function FilterChips({ active }: { active: WorkOrderFilter | null }) {
    const chips: { key: WorkOrderFilter | null; label: string }[] = [
        { key: null, label: "All" },
        ...(Object.keys(WORK_ORDER_FILTERS) as WorkOrderFilter[]).map((key) => ({
            key,
            label: WORK_ORDER_FILTERS[key].label,
        })),
    ];

    return (
        <nav aria-label="Filter work orders" className="-mx-4 mb-4 overflow-x-auto px-4">
            <ul className="flex gap-2">
                {chips.map((chip) => {
                    const isActive = chip.key === active;
                    return (
                        <li key={chip.label} className="shrink-0">
                            <Link
                                href={chip.key ? `/work-orders?status=${chip.key}` : "/work-orders"}
                                aria-current={isActive ? "page" : undefined}
                                className={`block rounded-full border px-3 py-1 text-sm ${
                                    isActive
                                        ? "border-neutral-100 bg-neutral-100 text-neutral-900"
                                        : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-100"
                                }`}
                            >
                                {chip.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
