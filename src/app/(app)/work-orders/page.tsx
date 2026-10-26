import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import PageHeader from "@/components/list/PageHeader";
import EmptyState from "@/components/list/EmptyState";
import { WorkOrderList, type WorkOrderWithPlace } from "@/components/WorkOrderRow";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import {
    SPLIT_VIEW_COOKIE,
    STATUS_ORDER,
    WORK_ORDER_FILTERS,
    WORK_ORDER_SORTS,
    isWorkOrderFilter,
    type WorkOrderFilter,
    type WorkOrderSort,
} from "@/lib/workOrders";
import {
    hrefWithSort,
    parseSort,
    sortLabels,
    sortRows,
    type SearchParams,
    type SortLabel,
    type SortState,
} from "@/lib/sorting";
import FilterMenu, { type FilterOption } from "./FilterMenu";
import ListSettings from "./ListSettings";

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
    const splitView = (await cookies()).get(SPLIT_VIEW_COOKIE)?.value === "1";

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
    const sortedWorkOrders = sortRows(workOrders, WORK_ORDER_SORTS, sort);
    const label = sortLabels("/work-orders", params, WORK_ORDER_SORTS, sort);

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-foreground">
            <PageHeader
                title="Work Orders"
                subtitle={`${workOrders.length} ${noun}`}
                actionHref="/work-orders/new"
                actionLabel="Add Work Order"
            />

            <div className="mb-4 flex items-center gap-2">
                <Filters active={filter} sort={sort} />
                <ListSettings splitView={splitView} />
            </div>

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
            ) : splitView ? (
                <SplitList workOrders={sortedWorkOrders} label={label} />
            ) : (
                <WorkOrderList workOrders={sortedWorkOrders} label={label} />
            )}
        </main>
    );
}

// One section per status, in workflow order. Empty sections are left out.
function SplitList({
    workOrders,
    label,
}: {
    workOrders: WorkOrderWithPlace[];
    label: (label: string, key: WorkOrderSort) => SortLabel;
}) {
    return (
        <div className="flex flex-col gap-8">
            {STATUS_ORDER.map((status) => {
                const rows = workOrders.filter((wo) => wo.status === status);
                if (rows.length === 0) return null;

                return (
                    <section key={status}>
                        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
                            {WORK_ORDER_STATUS_LABELS[status]}
                            <span className="text-sm font-normal text-subtle">{rows.length}</span>
                        </h2>
                        <WorkOrderList workOrders={rows} label={label} />
                    </section>
                );
            })}
        </div>
    );
}

function Filters({ active, sort }: { active: WorkOrderFilter | null; sort: SortState<WorkOrderSort> | null }) {
    const chips: { key: WorkOrderFilter | null; label: string }[] = [
        { key: null, label: "All" },
        ...(Object.keys(WORK_ORDER_FILTERS) as WorkOrderFilter[]).map((key) => ({
            key,
            label: WORK_ORDER_FILTERS[key].label,
        })),
    ];

    const options: FilterOption[] = chips.map((chip) => ({
        label: chip.label,
        href: hrefWithSort("/work-orders", sort, chip.key ? { status: chip.key } : {}),
        active: chip.key === active,
    }));

    return (
        <nav aria-label="Filter work orders">
            <FilterMenu options={options} />
        </nav>
    );
}
