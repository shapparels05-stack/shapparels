import { z } from "zod";

export const promoPopupSchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().url("An image is required"),
  linkUrl: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().url("Link must be a valid URL").nullable().optional()
  ),
  frequency: z.enum(["daily", "session", "always"]).default("daily"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type PromoPopupInput = z.infer<typeof promoPopupSchema>;
