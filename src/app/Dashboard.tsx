import Link from "next/link";
import prisma from "@/lib/prisma";
import type { Organization } from "@/generated/prisma/client";
import Nav from "@/components/Nav";
import PageHeader from "@/components/list/PageHeader";
import { WorkOrderList } from "@/components/WorkOrderRow";
import { WORK_ORDER_FILTERS } from "@/lib/workOrders";

const include = { property: true, unit: true } as const;

export default async function Dashboard({ organization }: { organization: Organization }) {
    const base = { organizationId: organization.id, archived: false };

    const [
        draftCount,
        activeCount,
        completedCount,
        overdueCount,
        completedOrders,
        overdueOrders,
        recentOrders,
        propertyCount,
        contractorCount,
        workOrderCount,
    ] = await Promise.all([
        prisma.workOrder.count({ where: { ...base, ...WORK_ORDER_FILTERS.draft.where() } }),
        prisma.workOrder.count({ where: { ...base, ...WORK_ORDER_FILTERS.active.where() } }),
        prisma.workOrder.count({ where: { ...base, ...WORK_ORDER_FILTERS.completed.where() } }),
        prisma.workOrder.count({ where: { ...base, ...WORK_ORDER_FILTERS.overdue.where() } }),
        prisma.workOrder.findMany({
            where: { ...base, ...WORK_ORDER_FILTERS.completed.where() },
            orderBy: { completedAt: "asc" },
            take: 10,
            include,
        }),
        prisma.workOrder.findMany({
            where: { ...base, ...WORK_ORDER_FILTERS.overdue.where() },
            orderBy: { dueDate: "asc" },
            take: 10,
            include,
        }),
        // Fetch extra so there are still 5 left after removing the ones already under "Needs attention".
        prisma.workOrder.findMany({ where: base, orderBy: { updatedAt: "desc" }, take: 25, include }),
        prisma.property.count({ where: base }),
        prisma.contact.count({ where: { ...base, contactType: "CONTRACTOR" } }),
        prisma.workOrder.count({ where: { organizationId: organization.id } }),
    ]);

    const needsAttention = [...completedOrders, ...overdueOrders].slice(0, 10);
    const attentionIds = new Set(needsAttention.map((wo) => wo.id));
    const recentActivity = recentOrders.filter((wo) => !attentionIds.has(wo.id)).slice(0, 5);

    const steps = [
        { label: "Add a property", href: "/properties/new", done: propertyCount > 0 },
        { label: "Add a contractor", href: "/contacts/new", done: contractorCount > 0 },
        { label: "Set your office contact", href: "/settings", done: !!(organization.phone || organization.email) },
        { label: "Create a work order", href: "/work-orders/new", done: workOrderCount > 0 },
    ];

    return (
        <div className="text-neutral-100">
            <Nav />
            <main className="mx-auto max-w-5xl px-4 py-10">
                <PageHeader
                    title={organization.name}
                    subtitle="Dashboard"
                    actionHref="/work-orders/new"
                    actionLabel="Create work order"
                    mobileLabel="+ New"
                />

                {steps.some((s) => !s.done) && <GetStarted steps={steps} />}

                <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Drafts" value={draftCount} href="/work-orders?status=draft" />
                    <StatCard
                        label="With contractor"
                        value={activeCount}
                        href="/work-orders?status=active"
                        accent="text-amber-400"
                    />
                    <StatCard
                        label="To review"
                        value={completedCount}
                        href="/work-orders?status=completed"
                        accent="text-green-400"
                    />
                    <StatCard
                        label="Overdue"
                        value={overdueCount}
                        href="/work-orders?status=overdue"
                        accent="text-red-400"
                    />
                </div>

                {needsAttention.length > 0 && (
                    <section className="mb-10">
                        <SectionHeading title="Needs attention" />
                        <p className="-mt-2 mb-3 text-sm text-neutral-500">
                            Completed work waiting to be closed out, and open work past its due date.
                        </p>
                        <WorkOrderList workOrders={needsAttention} />
                    </section>
                )}

                <section>
                    <SectionHeading title="Recent activity" href="/work-orders" />
                    {recentActivity.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-neutral-800 px-4 py-4 text-sm text-neutral-500">
                            {workOrderCount === 0 ? "No work orders yet." : "Nothing else recently."}
                        </p>
                    ) : (
                        <WorkOrderList workOrders={recentActivity} />
                    )}
                </section>
            </main>
        </div>
    );
}

function SectionHeading({ title, href }: { title: string; href?: string }) {
    return (
        <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            {href && (
                <Link href={href} className="text-sm text-neutral-400 hover:text-neutral-100">
                    View all
                </Link>
            )}
        </div>
    );
}

function StatCard({
    label,
    value,
    href,
    accent = "text-neutral-100",
}: {
    label: string;
    value: number;
    href: string;
    accent?: string;
}) {
    return (
        <Link
            href={href}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-600"
        >
            <p className="text-sm text-neutral-400">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${value > 0 ? accent : "text-neutral-600"}`}>{value}</p>
        </Link>
    );
}

function GetStarted({ steps }: { steps: { label: string; href: string; done: boolean }[] }) {
    const doneCount = steps.filter((s) => s.done).length;

    return (
        <section className="mb-8 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-semibold">Get started</h2>
                <span className="text-sm text-neutral-500">
                    {doneCount} of {steps.length} done
                </span>
            </div>
            <ol className="grid gap-2 sm:grid-cols-2">
                {steps.map((step) => (
                    <li key={step.label}>
                        {step.done ? (
                            <span className="flex items-center gap-2 text-sm text-neutral-500 line-through">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-green-700 text-xs text-green-400 no-underline">
                                    ✓
                                </span>
                                {step.label}
                            </span>
                        ) : (
                            <Link
                                href={step.href}
                                className="flex items-center gap-2 text-sm text-neutral-100 hover:underline"
                            >
                                <span className="h-5 w-5 shrink-0 rounded-full border border-neutral-600" />
                                {step.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}
