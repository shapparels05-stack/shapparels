import { z } from "zod";

export const specialOfferSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive("Price must be positive"),
  images: z.array(z.string().url()).default([]),
  saleEndsAt: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().nullable().optional()
  ),
  saleRepeatHours: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable().optional()
  ),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable().optional(),
      })
    )
    .min(1, "Select at least one product"),
});

export type SpecialOfferInput = z.infer<typeof specialOfferSchema>;
