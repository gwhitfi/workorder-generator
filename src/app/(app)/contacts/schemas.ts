import { z } from "zod";
import { ContactType } from "@/generated/prisma/enums";
import { email, phone } from "@/lib/validation";

const zip = z
    .string()
    .trim()
    .regex(/^(\d{5}(-\d{4})?)?$/, "Enter a 5-digit zip code")
    .optional()
    .transform((val) => val || null);

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((val) => val || null);

export const contactInput = z.object({
    contactType: z.enum(ContactType),
    displayName: z.string().trim().min(1, "Enter a name").max(100),
    firstName: optionalText(100),
    lastName: optionalText(100),
    company: optionalText(100),
    addressLine1: optionalText(200),
    addressLine2: optionalText(200),
    city: optionalText(100),
    state: optionalText(2),
    zipCode: zip,
    email,
    phone,
    notes: optionalText(2000),
    unitId: optionalText(100),
});

export type ContactFormState = {
    errors?: Partial<Record<keyof z.input<typeof contactInput>, string[]>>;
    values?: Record<string, string>;
};
