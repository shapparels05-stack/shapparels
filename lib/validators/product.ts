import { z } from "zod";

export const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  code: z.string().optional().nullable(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  basePrice: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  saleEndsAt: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.date().nullable().optional()
  ),
  // Hours between auto-repeats of the limited-time offer. Null = no repeat.
  saleRepeatHours: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().positive().nullable().optional()
  ),
  categoryId: z.string().uuid().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  bestSellerVariantId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
  isResizeable: z.boolean().default(false),
  showLowStock: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  alt: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const optionTypeSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  sortOrder: z.number().int().default(0),
  values: z.array(
    z.object({
      value: z.string().min(1, "Option value is required"),
      sortOrder: z.number().int().default(0),
    })
  ).min(1, "At least one value is required"),
});

export const variantSchema = z.object({
  sku: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  isActive: z.boolean().default(true),
  optionValueIds: z.array(z.string().uuid()).default([]),
});

export type ProductCreate = z.infer<typeof productCreateSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type OptionType = z.infer<typeof optionTypeSchema>;
export type Variant = z.infer<typeof variantSchema>;
