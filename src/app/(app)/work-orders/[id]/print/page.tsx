import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PRIORITY_LABELS, WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import BackButton from "@/components/BackButton";

export default async function WorkOrderPrint({ params }: { params: Promise<{ id: string }> }) {
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

    return (
        <main className="mx-auto max-w-3xl bg-white px-4 py-10 text-neutral-900 print:py-0">
            <div className="print:hidden">
                <BackButton />
            </div>
            <div className="mb-8">
                <div className="mb-1 flex items-center gap-3">
                    <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-800">
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                    </span>
                    {workOrder.dueDate && (
                        <span className="text-sm text-neutral-800">Due by {workOrder.dueDate.toLocaleDateString()}</span>
                    )}
                </div>

                <h1 className="text-2xl font-semibold mb-2">{workOrder.title ?? "Untitled work order"}</h1>
                <div>
                    {workOrder.propertyId && (
                        <div>
                            <span className="font-medium">Address: </span>
                            {workOrder.property.addressLine1} {workOrder.property.city}, {workOrder.property.state}{" "}
                            {workOrder.property.zipCode}
                        </div>
                    )}
                </div>
                <div>
                    {workOrder.tenantName && (
                        <div>
                            <span className="font-medium">Tenant: </span>
                            {workOrder.tenantName} {workOrder.tenantPhone} {workOrder.tenantEmail}
                        </div>
                    )}
                </div>
                <div>
                    {workOrder.contractorName && (
                        <div>
                            <span className="font-medium">Contractor: </span>
                            {workOrder.contractorName} {workOrder.contractorPhone} {workOrder.contractorEmail}
                        </div>
                    )}
                </div>
            </div>
            {workOrder.notes && (
                <div className="text-sm text-neutral-800 leading-relaxed">
                    <p className="text-xs uppercase tracking-wide text-neutral-800">Notes</p>
                    <p className="mt-1">{workOrder.notes}</p>
                </div>
            )}
            <div>
                {workOrder.areas.map((area) => (
                    <section key={area.id} className="mb-6">
                        <h2 className="mb-2 font-semibold">{area.name}</h2>
                        {area.lineItems.length === 0 ? (
                            <p className="text-sm text-neutral-800">No items.</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {area.lineItems.map((item) => (
                                    <li key={item.id} className="flex items-start gap-2">
                                        <span>☐</span>
                                        <span className="flex-1">
                                            {item.description}
                                            {item.tags.map((tag) => (
                                                <span key={tag.id} className="ml-2 text-sm">
                                                    [{tag.name}]
                                                </span>
                                            ))}
                                        </span>
                                        <span>
                                            {item.priority === "EMERGENCY" || item.priority === "HIGH"
                                                ? PRIORITY_LABELS[item.priority]
                                                : ""}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
            <div>
                <h4>Completed date and signature</h4>
                <p>_____________________________________</p>
            </div>
        </main>
    );
}
