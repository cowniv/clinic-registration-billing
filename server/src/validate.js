import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const patientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().min(1, "Last name is required").max(60),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d) <= new Date(), "Invalid birth date"),
  sex: z.enum(["M", "F"]),
  phone: z
    .string()
    .trim()
    .regex(/^(09\d{9}|\+639\d{9})?$/, "Use 09XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(200).optional(),
});

export const serviceSchema = z.object({
  code: z.string().trim().min(2).max(12).toUpperCase(),
  name: z.string().trim().min(2).max(80),
  category: z.enum(["consultation", "laboratory", "imaging", "procedure", "other"]),
  price_cents: z.number().int().nonnegative(),
  active: z.boolean().optional(),
});

export const visitSchema = z.object({
  patient_id: z.number().int().positive(),
  reason: z.string().trim().max(200).optional(),
});

export const discountSchema = z
  .object({
    discount_type: z.enum(["none", "senior", "pwd"]),
    discount_id_no: z.string().trim().max(30).optional(),
  })
  .refine((d) => d.discount_type === "none" || (d.discount_id_no && d.discount_id_no.length >= 4), {
    message: "Senior/PWD ID number is required for the discount",
    path: ["discount_id_no"],
  });

export const lineItemSchema = z.object({
  service_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const paymentSchema = z
  .object({
    method: z.enum(["cash", "gcash", "card"]),
    amount_cents: z.number().int().positive(),
    tendered_cents: z.number().int().positive().optional(),
    reference: z.string().trim().max(40).optional(),
  })
