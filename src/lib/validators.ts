import { z } from "zod";
import { SIZES } from "@/lib/pricing";
import { ORDER_STATUSES } from "@/types";

const trimmed = (max: number) => z.string().trim().max(max);

export const addressSchema = z.object({
  full_name: trimmed(80).min(2, "Enter the recipient's name"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
  line1: trimmed(120).min(3, "Enter house / street"),
  line2: trimmed(120).default(""),
  city: trimmed(60).min(2, "Enter city"),
  state: trimmed(60).min(2, "Enter state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const profileSchema = z.object({
  full_name: trimmed(80),
  phone: trimmed(20),
});

export const uuidSchema = z.string().uuid();

/** Admin product form. Prices are entered in rupees and stored in paise. */
export const productSchema = z
  .object({
    name: trimmed(120).min(2, "Name is required"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
    category_id: z.string().uuid("Choose a category"),
    description: trimmed(4000),
    price: z.coerce.number().positive("Price must be more than 0").max(1_000_000),
    compare_at_price: z
      .union([z.literal(""), z.coerce.number().positive().max(1_000_000)])
      .transform((v) => (v === "" ? null : v)),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    stock: z.record(z.enum(SIZES), z.coerce.number().int().min(0).max(100_000)),
  })
  .refine((p) => p.compare_at_price == null || p.compare_at_price > p.price, {
    message: "Compare-at price must be higher than the price",
    path: ["compare_at_price"],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const orderStatusSchema = z.enum(ORDER_STATUSES as [string, ...string[]]);

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
