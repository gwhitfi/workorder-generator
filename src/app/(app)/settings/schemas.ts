import { z } from "zod";
import { optionalEmail, optionalPhone } from "@/lib/validation";

export const organizationInput = z.object({
    name: z.string().trim().min(1, "Enter an organization name").max(100),
    phone: optionalPhone,
    email: optionalEmail,
});

export type OrganizationFormState = {
    ok?: boolean;
    error?: string;
    errors?: Partial<Record<keyof z.input<typeof organizationInput>, string[]>>;
    values?: Record<string, string>;
};
