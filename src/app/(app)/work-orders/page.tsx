import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/defaults";
import Link from "next/link";
import prisma from "@/lib/prisma";
import BackButton from "@/components/BackButton";

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
            _count: {
                select: { areas: true },
            },
        },
    });

    return (
        <main className="mx-auto max-w-5xl px-4 py-10 text-neutral-100">
            <BackButton />
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Work Orders</h1>
                {workOrders.length === 0 && (
                    <div>
                        <h2>No work orders added yet</h2>
                    </div>
                )}
                <Link
                    href="/work-orders/new"
                    className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
                >
                    Add Work Order
                </Link>
            </div>
            {workOrders.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800 text-left text-neutral-400">
                            <th className="px-3 pb-2 font-medium">Title</th>
                            <th className="px-3 pb-2 font-medium">Due Date</th>
                            <th className="px-3 pb-2 font-medium">Status</th>
                            <th className="px-3 pb-2 font-medium">Property</th>
                            <th className="px-3 pb-2 font-medium">Unit</th>
                            <th className="px-3 pb-2 font-medium">Contractor</th>

                            <th className="px-3 pb-2 font-medium"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {workOrders.map((workOrder) => (
                            <tr key={workOrder.id} className="border-b border-neutral-900 hover:bg-neutral-900/50">
                                <td className="px-3 py-3">{workOrder.title}</td>
                                <td className="px-3 py-3 text-neutral-400">
                                    {workOrder.dueDate ? workOrder.dueDate.toLocaleDateString() : "-"}
                                </td>
                                <td className="px-3 py-3 text-neutral-400">{WORK_ORDER_STATUS_LABELS[workOrder.status]}</td>
                                <td className="px-3 py-3 text-neutral-400">{workOrder.property.addressLine1}</td>
                                <td className="px-3 py-3 text-neutral-400">{workOrder.unit ? workOrder.unit?.name : ""}</td>
                                <td className="px-3 py-3 text-neutral-400">{workOrder.contractorName}</td>
                                <td className="px-3 py-3 text-right">
                                    <Link
                                        href={`/work-orders/${workOrder.id}`}
                                        className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-white"
                                    >
                                        View Detail
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </main>
    );
}
