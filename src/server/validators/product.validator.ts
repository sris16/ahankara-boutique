import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const baseProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
  slug: z.string().trim().regex(slugRegex, 'Slug can only contain lowercase letters, numbers, and hyphens').max(100),
  shortDescription: z.string().trim().max(300, 'Short description max 300 characters').optional().nullable(),
  description: z.string().trim().max(10000, 'Description max 10000 characters').optional().nullable(),
  
  basePrice: z.number().int().min(1, 'Base price must be greater than 0'),
  compareAtPrice: z.number().int().min(1, 'Compare at price must be greater than 0').optional().nullable(),
  
  categoryId: z.string().uuid('Invalid category ID'),
  collectionIds: z.array(z.string().uuid('Invalid collection ID')).optional(),

  isFeatured: z.boolean().default(false),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.DRAFT),

  metaTitle: z.string().trim().max(100).optional().nullable(),
  metaDescription: z.string().trim().max(255).optional().nullable(),
});

export const createProductSchema = baseProductSchema.refine(
  (data) => {
    if (data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
      return data.compareAtPrice >= data.basePrice;
    }
    return true;
  },
  {
    message: "Compare at price must be greater than or equal to base price",
    path: ["compareAtPrice"],
  }
);

export const updateProductSchema = baseProductSchema.partial().refine(
  (data) => {
    if (data.basePrice !== undefined && data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
      return data.compareAtPrice >= data.basePrice;
    }
    return true;
  },
  {
    message: "Compare at price must be greater than or equal to base price",
    path: ["compareAtPrice"],
  }
);

export const productListFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  collectionSlug: z.string().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isFeatured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['newest', 'price-low-high', 'price-high-low', 'name']).default('newest'),
});
