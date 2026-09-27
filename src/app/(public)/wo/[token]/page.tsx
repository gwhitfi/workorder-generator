import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { STATUS_COLORS, WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import InfoCard from "@/components/InfoCard";
import ContractorSpaceCard from "./ContractorSpaceCard";
import CompleteWorkOrder from "./CompleteWorkOrder";
import { formatDueDate, formatTimestamp } from "@/lib/dates";

// The token is the only thing protecting this page, so keep it out of search engines and referrer headers.
export const metadata: Metadata = {
    title: "Work Order",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

export default async function PublicWorkOrder({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const workOrder = await prisma.workOrder.findUnique({
        where: { publicToken: token },
        include: {
            organization: { select: { name: true, phone: true, email: true } },
            property: true,
            unit: true,
            areas: {
                orderBy: { sortOrder: "asc" },
                include: {
                    lineItems: {
                        orderBy: { sortOrder: "asc" },
                        include: { tags: true },
                    },
                },
            },
        },
    });

    // Drafts haven't been sent yet, so the link shouldn't work until they are.
    if (!workOrder || workOrder.archived || workOrder.status === "DRAFT") notFound();

    const readOnly = workOrder.status === "COMPLETED" || workOrder.status === "CLOSED";
    const itemCount = workOrder.areas.reduce((sum, area) => sum + area.lineItems.length, 0);
    const completedCount = workOrder.areas.reduce(
        (sum, area) => sum + area.lineItems.filter((i) => i.completed).length,
        0,
    );

    return (
        <main className="mx-auto max-w-3xl px-4 py-10 text-neutral-100">
            <div className="mb-8">
                <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    {workOrder.organization.name} · #{workOrder.jobNumber ?? workOrder.id.slice(-6).toUpperCase()}
                </p>

                <div className="mb-1 flex items-center gap-3">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_COLORS[workOrder.status]}`}>
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                    </span>
                    {workOrder.dueDate && (
                        <span className="text-sm text-neutral-500">Due by {formatDueDate(workOrder.dueDate)}</span>
                    )}
                </div>

                <h1 className="mb-4 text-2xl font-semibold">{workOrder.title ?? "Work order"}</h1>

                {workOrder.status === "COMPLETED" && (
                    <p className="mb-4 rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-sm text-green-300">
                        Marked complete{workOrder.completedAt && ` on ${formatTimestamp(workOrder.completedAt)}`}.
                        Contact the office if anything needs to change.
                    </p>
                )}
                {workOrder.status === "CLOSED" && (
                    <p className="mb-4 rounded-md border border-blue-800 bg-blue-950/40 px-3 py-2 text-sm text-blue-300">
                        This work order has been closed out. No further work is needed.
                    </p>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    <InfoCard
                        label="Property"
                        title={`${workOrder.property.addressLine1}${
                            workOrder.unit && !workOrder.unit.isDefault ? `, Unit ${workOrder.unit.name}` : ""
                        }`}
                    >
                        {workOrder.property.addressLine2 && <p>{workOrder.property.addressLine2}</p>}
                        <p>
                            {workOrder.property.city}, {workOrder.property.state} {workOrder.property.zipCode}
                        </p>
                    </InfoCard>

                    <InfoCard label="Tenant" title={workOrder.tenantName ?? "No tenant on file"}>
                        {workOrder.tenantPhone && (
                            <a href={`tel:${workOrder.tenantPhone}`} className="block hover:text-neutral-100">
                                {workOrder.tenantPhone}
                            </a>
                        )}
                        {workOrder.tenantEmail && (
                            <a
                                href={`mailto:${workOrder.tenantEmail}`}
                                className="block break-all hover:text-neutral-100"
                            >
                                {workOrder.tenantEmail}
                            </a>
                        )}
                    </InfoCard>

                    <InfoCard label="Office" title={workOrder.organization.name}>
                        {workOrder.organization.phone && (
                            <a href={`tel:${workOrder.organization.phone}`} className="block hover:text-neutral-100">
                                {workOrder.organization.phone}
                            </a>
                        )}
                        {workOrder.organization.email && (
                            <a
                                href={`mailto:${workOrder.organization.email}`}
                                className="block break-all hover:text-neutral-100"
                            >
                                {workOrder.organization.email}
                            </a>
                        )}
                        {!workOrder.organization.phone && !workOrder.organization.email && (
                            <p className="text-neutral-500">No contact info on file</p>
                        )}
                    </InfoCard>
                </div>
            </div>

            {workOrder.notes && (
                <div className="mb-6 text-sm text-neutral-400 leading-relaxed">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Notes</p>
                    <p className="mt-1 whitespace-pre-line">{workOrder.notes}</p>
                </div>
            )}

            <div className="border-t border-neutral-800 pt-6">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-semibold text-neutral-100">Work items</h2>
                    {itemCount > 0 && (
                        <span className="text-sm text-neutral-500">
                            {completedCount} of {itemCount} done
                        </span>
                    )}
                </div>
                {!readOnly && (
                    <p className="mt-1 mb-4 text-sm text-neutral-500">
                        Check off each item as you finish it. Add a note if anything needs explaining.
                    </p>
                )}

                {workOrder.areas.length === 0 ? (
                    <p className="mt-4 text-sm text-neutral-500">No work items listed.</p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-2">
                        {workOrder.areas.map((area) => (
                            <ContractorSpaceCard key={area.id} token={token} area={area} readOnly={readOnly} />
                        ))}
                    </ul>
                )}
            </div>

            {readOnly ? (
                workOrder.completionNotes && (
                    <section className="mt-8 border-t border-neutral-800 pt-6 text-sm">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Completion notes</p>
                        <p className="mt-1 whitespace-pre-line leading-relaxed text-neutral-300">
                            {workOrder.completionNotes}
                        </p>
                    </section>
                )
            ) : (
                <CompleteWorkOrder token={token} remainingCount={itemCount - completedCount} />
            )}
        </main>
    );
}
