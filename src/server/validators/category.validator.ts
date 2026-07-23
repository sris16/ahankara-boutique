import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100, 'Category name is too long'),
  slug: z.string().trim().min(1, 'Slug is required').max(100, 'Slug is too long'),
  description: z.string().trim().max(1000, 'Description is too long').optional().nullable(),
  parentId: z.string().uuid('Invalid parent ID').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metaTitle: z.string().trim().max(150, 'Meta title is too long').optional().nullable(),
  metaDescription: z.string().trim().max(300, 'Meta description is too long').optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();
