import { z } from "zod";

const PHONE_MESSAGE = "Enter a 10-digit phone number";

const digitsOnly = (val: string) => val.replace(/\D/g, "");

export const email = z.string().trim().max(254).pipe(z.email());

export const phone = z
    .string()
    .transform(digitsOnly)
    .pipe(z.string().regex(/^1?\d{10}$/, PHONE_MESSAGE))
    .transform((digits) => digits.slice(-10));

// Empty or missing becomes null. Not built from `email`/`phone` with z.union,
// which would replace their messages with a generic "Invalid input".
export const optionalEmail = z
    .string()
    .trim()
    .max(254)
    .refine((val) => val === "" || z.email().safeParse(val).success, "Invalid email address")
    .optional()
    .transform((val) => val || null);

export const optionalPhone = z
    .string()
    .transform(digitsOnly)
    .pipe(z.string().regex(/^(1?\d{10})?$/, PHONE_MESSAGE))
    .optional()
    .transform((digits) => (digits ? digits.slice(-10) : null));
