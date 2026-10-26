import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { WorkOrderList } from "@/components/WorkOrderRow";
import {
    WORK_ORDER_FILTERS,
    WORK_ORDER_SORTS,
    isWorkOrderFilter,
    type WorkOrderFilter,
    type WorkOrderSort,
} from "@/lib/workOrders";
import { hrefWithSort, parseSort, sortLabels, sortRows, type SearchParams, type SortState } from "@/lib/sorting";

export default async function WorkOrder({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const params = await searchParams;
    const filter = isWorkOrderFilter(params.status) ? params.status : null;
    const sort = parseSort(params, WORK_ORDER_SORTS);

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
            contractor: { select: { firstName: true, lastName: true } },
        },
    });

    const noun = workOrders.length === 1 ? "work order" : "work orders";

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-foreground">
            <PageHeader
                title="Work Orders"
                subtitle={`${workOrders.length} ${noun}`}
                actionHref="/work-orders/new"
                actionLabel="Add Work Order"
            />

            <FilterChips active={filter} sort={sort} />

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
                <WorkOrderList
                    workOrders={sortRows(workOrders, WORK_ORDER_SORTS, sort)}
                    label={sortLabels("/work-orders", params, WORK_ORDER_SORTS, sort)}
                />
            )}
        </main>
    );
}

function FilterChips({ active, sort }: { active: WorkOrderFilter | null; sort: SortState<WorkOrderSort> | null }) {
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
                                href={hrefWithSort("/work-orders", sort, chip.key ? { status: chip.key } : {})}
                                aria-current={isActive ? "page" : undefined}
                                className={`block rounded-full border px-3 py-1 text-sm ${
                                    isActive
                                        ? "border-accent bg-accent text-on-accent"
                                        : "border-line-strong text-muted hover:border-subtle hover:text-foreground"
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
