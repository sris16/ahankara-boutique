import { z } from 'zod';

const baseCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Collection name is required').max(100, 'Collection name is too long'),
  slug: z.string().trim().min(1, 'Slug is required').max(100, 'Slug is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().datetime().or(z.date()).optional().nullable(),
  endsAt: z.string().datetime().or(z.date()).optional().nullable(),
  metaTitle: z.string().trim().max(150, 'Meta title is too long').optional().nullable(),
  metaDescription: z.string().trim().max(300, 'Meta description is too long').optional().nullable(),
});

export const createCollectionSchema = baseCollectionSchema.refine(data => {
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) < new Date(data.endsAt);
  }
  return true;
}, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});

export const updateCollectionSchema = baseCollectionSchema.partial().refine(data => {
  // We can't strictly enforce startsAt < endsAt on partial updates easily without DB context if only one is updated,
  // but we can enforce it if both are provided.
  if (data.startsAt && data.endsAt) {
    return new Date(data.startsAt) < new Date(data.endsAt);
  }
  return true;
}, {
  message: "endsAt must be after startsAt",
  path: ["endsAt"],
});
