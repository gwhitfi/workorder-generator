import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";

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

    return (
        <main className="mx-auto max-w-3xl px-4 py-10 text-neutral-100">
            <div className="mb-8">
                <div className="mb-1 flex items-center gap-3">
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                    </span>
                    {workOrder.dueDate && (
                        <span className="text-sm text-neutral-500">Due by {workOrder.dueDate.toLocaleDateString()}</span>
                    )}
                </div>

                <h1 className="text-2xl font-semibold mb-2">{workOrder.title ?? "Untitled work order"}</h1>

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
            {workOrder.notes && (
                <div className="text-sm text-neutral-400 leading-relaxed">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Notes</p>
                    <p className="mt-1">{workOrder.notes}</p>
                </div>
            )}
        </main>
    );
}

function InfoCard({
    label,
    href,
    title,
    children,
}: {
    label: string;
    href?: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="relative rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600">
            <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">{label}</p>

            {href ? (
                <Link
                    href={href}
                    className="truncate block font-medium text-neutral-100 before:absolute before:inset-0 before:content-['']"
                >
                    {title}
                </Link>
            ) : (
                <p className="truncate font-medium text-neutral-100">{title}</p>
            )}

            <div className="relative z-10 mt-1 text-sm text-neutral-400 leading-relaxed">{children}</div>
        </div>
    );
}
