import { z } from "zod";
import { ContactType } from "@/generated/prisma/enums";
import { email, optionalState, phone } from "@/lib/validation";

const zip = z
    .string()
    .trim()
    .regex(/^(\d{5}(-\d{4})?)?$/, "Enter a 5-digit zip code")
    .optional()
    .transform((val) => val || null);

const tooLong = (max: number) => `Use ${max} characters or fewer`;

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, tooLong(max))
        .optional()
        .transform((val) => val || null);

export const contactInput = z.object({
    contactType: z.enum(ContactType),
    displayName: z.string().trim().min(1, "Enter a name").max(100, tooLong(100)),
    firstName: optionalText(50),
    lastName: optionalText(50),
    company: optionalText(100),
    addressLine1: optionalText(200),
    addressLine2: optionalText(200),
    city: optionalText(100),
    state: optionalState,
    zipCode: zip,
    email,
    phone,
    notes: optionalText(5000),
    unitId: optionalText(100),
});

export type ContactFormState = {
    error?: string;
    // propertyId isn't saved, but a tenant's missing property is reported against it.
    errors?: Partial<Record<keyof z.input<typeof contactInput> | "propertyId", string[]>>;
    values?: Record<string, string>;
};
