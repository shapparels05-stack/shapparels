import { z } from "zod";

export const reviewCreateSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1, "Please pick a rating").max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .min(10, "Please write at least 10 characters")
    .max(2000, "Review is too long"),
  authorName: z.string().min(1, "Name is required").max(80),
  authorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  // Honeypot: real users never fill this hidden field. Bots do.
  website: z.string().optional(),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});
