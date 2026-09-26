import prisma from "@/lib/prisma";

export default async function DisplayWorkOrder(token: string) {
    const workOrder = await prisma.workOrder.findUnique({
        where: { publicToken: token },
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

    if (!workOrder) throw new Error("Invalid work order");

    return <main>{workOrder.status === "CLOSED" && <h1>Work Order Status: Closed Out</h1>}</main>;
}
