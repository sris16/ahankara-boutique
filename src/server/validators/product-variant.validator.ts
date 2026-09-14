import { z } from 'zod';

function normalizeString(val: string | null | undefined): string | null {
  if (val === null || val === undefined) return null;
  const trimmed = val.trim();
  if (trimmed === '') return null;
  return trimmed;
}

function normalizeTitleCase(val: string | null | undefined): string | null {
  const norm = normalizeString(val);
  if (!norm) return null;
  // Convert "  black " -> "Black"
  return norm.split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

function normalizeUppercase(val: string | null | undefined): string | null {
  const norm = normalizeString(val);
  if (!norm) return null;
  return norm.toUpperCase();
}

export const createProductVariantSchema = z.object({
  sku: z.string().min(1, 'SKU cannot be empty').trim().toUpperCase(),
  size: z.string().nullable().optional().transform(normalizeUppercase),
  color: z.string().nullable().optional().transform(normalizeTitleCase),
  
  price: z.number().int().min(1, 'Price must be greater than 0').nullable().optional(),
  compareAtPrice: z.number().int().min(1, 'Compare-at price must be greater than 0').nullable().optional(),
  
  isActive: z.boolean().default(true).optional(),
  
  // Initial inventory
  quantity: z.number().int().min(0, 'Quantity cannot be negative').default(0).optional(),
  lowStockThreshold: z.number().int().min(0, 'Threshold cannot be negative').default(0).optional(),
  
  weightInGrams: z.number().int().min(1, 'Weight must be greater than 0').nullable().optional(),
  lengthCm: z.number().min(0.1, 'Length must be greater than 0').nullable().optional(),
  breadthCm: z.number().min(0.1, 'Breadth must be greater than 0').nullable().optional(),
  heightCm: z.number().min(0.1, 'Height must be greater than 0').nullable().optional(),
}).refine(data => {
  if (data.price && data.compareAtPrice) {
    return data.compareAtPrice >= data.price;
  }
  return true;
}, {
  message: 'Compare-at price must be greater than or equal to the variant price',
  path: ['compareAtPrice']
});

export const updateProductVariantSchema = z.object({
  sku: z.string().min(1, 'SKU cannot be empty').trim().toUpperCase().optional(),
  size: z.string().nullable().optional().transform(normalizeUppercase),
  color: z.string().nullable().optional().transform(normalizeTitleCase),
  
  price: z.number().int().min(1, 'Price must be greater than 0').nullable().optional(),
  compareAtPrice: z.number().int().min(1, 'Compare-at price must be greater than 0').nullable().optional(),
  
  isActive: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),

  weightInGrams: z.number().int().min(1, 'Weight must be greater than 0').nullable().optional(),
  lengthCm: z.number().min(0.1, 'Length must be greater than 0').nullable().optional(),
  breadthCm: z.number().min(0.1, 'Breadth must be greater than 0').nullable().optional(),
  heightCm: z.number().min(0.1, 'Height must be greater than 0').nullable().optional(),
}).refine(data => {
  if (data.price && data.compareAtPrice) {
    return data.compareAtPrice >= data.price;
  }
  return true;
}, {
  message: 'Compare-at price must be greater than or equal to the variant price',
  path: ['compareAtPrice']
});
