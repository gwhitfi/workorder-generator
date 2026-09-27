import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import InfoCard from "@/components/InfoCard";
import AreaBuilder from "./AreaBuilder";
import StatusActions from "./StatusActions";
import ContractorLink from "./ContractorLink";

export default async function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getCurrentUser();

    if (result.state === "signed-out") {
        redirect("/sign-in");
    }

    if (result.state === "needs-org") {
        redirect("/setup");
    }

    const workOrder = await prisma.workOrder.findFirst({
        where: {
            id,
            organizationId: result.organization.id,
        },
        include: {
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

    if (!workOrder) notFound();

    const spaces = await prisma.space.findMany({
        where: {
            organizationId: result.organization.id,
            archived: false,
            OR: [{ unitId: null }, { unitId: workOrder.unitId }],
        },
        orderBy: { sortOrder: "asc" },
    });

    const tags = await prisma.tag.findMany({
        where: { organizationId: result.organization.id, archived: false },
        orderBy: { sortOrder: "asc" },
    });

    const lineItems = workOrder.areas.flatMap((area) => area.lineItems);
    const doneCount = lineItems.filter((item) => item.completed).length;
    const readOnly = workOrder.status === "COMPLETED" || workOrder.status === "CLOSED";
    const contractorWorking = workOrder.status === "SENT" || workOrder.status === "IN_PROGRESS";

    return (
        <main className="mx-auto max-w-3xl px-4 py-10 text-neutral-100">
            <div className="mb-8">
                <div className="mb-1 flex items-center gap-3">
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                    </span>
                    {workOrder.dueDate && (
                        <span className="text-sm text-neutral-500">
                            Due by {workOrder.dueDate.toLocaleDateString()}
                        </span>
                    )}
                    {lineItems.length > 0 && (
                        <span className="text-sm text-neutral-500">
                            {doneCount} of {lineItems.length} items done
                        </span>
                    )}
                </div>

                <h1 className="text-2xl font-semibold mb-2">{workOrder.title ?? "Untitled work order"}</h1>
                {lineItems.length > 0 && (
                    <div
                        role="progressbar"
                        aria-label="Items done"
                        aria-valuemin={0}
                        aria-valuemax={lineItems.length}
                        aria-valuenow={doneCount}
                        className="mb-6 h-1 overflow-hidden rounded-full bg-neutral-800"
                    >
                        <div
                            className="h-full rounded-full bg-green-600"
                            style={{ width: `${(doneCount / lineItems.length) * 100}%` }}
                        />
                    </div>
                )}

                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <InfoCard
                        label="Property"
                        title={workOrder.property.displayName}
                        href={`/properties/${workOrder.propertyId}`}
                    >
                        <p>
                            {workOrder.property.addressLine1}
                            {workOrder.unit && !workOrder.unit.isDefault && `, Unit ${workOrder.unit.name}`}
                        </p>
                        <p>
                            {workOrder.property.city}, {workOrder.property.state} {workOrder.property.zipCode}
                        </p>
                    </InfoCard>

                    <InfoCard
                        label="Contractor"
                        title={workOrder.contractorName ?? "Not assigned"}
                        href={workOrder.contractorId ? `/contacts/${workOrder.contractorId}` : undefined}
                    >
                        {workOrder.contractorPhone && <p>{workOrder.contractorPhone}</p>}
                        {workOrder.contractorEmail && <p>{workOrder.contractorEmail}</p>}
                    </InfoCard>

                    <InfoCard
                        label="Tenant"
                        title={workOrder.tenantName ?? "Not assigned"}
                        href={workOrder.tenantId ? `/contacts/${workOrder.tenantId}` : undefined}
                    >
                        {workOrder.tenantPhone && <p>{workOrder.tenantPhone}</p>}
                        {workOrder.tenantEmail && <p>{workOrder.tenantEmail}</p>}
                    </InfoCard>
                </div>
            </div>

            {readOnly && (
                <section
                    className={`mb-8 rounded-lg border p-4 ${
                        workOrder.status === "CLOSED"
                            ? "border-blue-800 bg-blue-950/30"
                            : "border-green-800 bg-green-950/30"
                    }`}
                >
                    <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">Completion</p>
                    <p className="text-sm text-neutral-300">
                        {workOrder.completedAt
                            ? `Marked complete on ${workOrder.completedAt.toLocaleDateString()}.`
                            : "Marked complete."}
                        {workOrder.status === "CLOSED" &&
                            workOrder.closedAt &&
                            ` Closed on ${workOrder.closedAt.toLocaleDateString()}.`}
                    </p>
                    {lineItems.length - doneCount > 0 && (
                        <p className="mt-1 text-sm text-amber-400">
                            {lineItems.length - doneCount}{" "}
                            {lineItems.length - doneCount === 1 ? "item was" : "items were"} not checked off.
                        </p>
                    )}
                    <p className="mt-3 text-xs uppercase tracking-wide text-neutral-500">Completion notes</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-300">
                        {workOrder.completionNotes ?? <span className="text-neutral-500">No completion notes.</span>}
                    </p>
                </section>
            )}

            <section className="mb-8">
                <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Contractor link</p>
                <ContractorLink workOrderId={workOrder.id} token={workOrder.publicToken} status={workOrder.status} />
            </section>

            {workOrder.notes && (
                <div className="text-sm text-neutral-400 leading-relaxed">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Notes</p>
                    <p className="mt-1">{workOrder.notes}</p>
                </div>
            )}

            <AreaBuilder
                workOrderId={workOrder.id}
                areas={workOrder.areas}
                spaces={spaces}
                tags={tags}
                readOnly={readOnly}
                notice={contractorWorking ? "The contractor can see changes immediately." : undefined}
            />
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-neutral-800 pt-6">
                <StatusActions
                    workOrderId={workOrder.id}
                    status={workOrder.status}
                    hasContractor={!!workOrder.contractorId}
                />
                <Link
                    href={`/work-orders/${workOrder.id}/print`}
                    className="shrink-0 rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-800"
                >
                    Print preview
                </Link>
            </div>
        </main>
    );
}
