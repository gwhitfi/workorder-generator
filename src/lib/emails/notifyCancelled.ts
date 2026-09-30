import { after } from "next/server";
import { sendEmail } from "@/lib/email";
import { cancelledEmail } from "./cancelledEmail";

type Organization = { name: string; phone: string | null; email: string | null };
type CancelledWorkOrder = {
    id: string;
    title: string | null;
    jobNumber: string;
    contractorEmail: string | null;
    address: string;
};

// Sends after the response, so a slow or failed email never blocks the action.
export function notifyContractorsCancelled(organization: Organization, workOrders: CancelledWorkOrder[]) {
    if (workOrders.length === 0) return;

    after(async () => {
        for (const workOrder of workOrders) {
            if (!workOrder.contractorEmail) continue;
            try {
                const email = cancelledEmail({
                    organization,
                    title: workOrder.title,
                    jobNumber: workOrder.jobNumber,
                    address: workOrder.address,
                });
                await sendEmail({
                    to: workOrder.contractorEmail,
                    ...email,
                    replyTo: organization.email,
                    fromName: organization.name,
                });
            } catch (error) {
                console.error(`Cancellation notice failed for work order ${workOrder.id}`, error);
            }
        }
    });
}
