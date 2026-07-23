import { z } from 'zod';

export const reorderImagesSchema = z.object({
  orderedImageIds: z.array(z.string().uuid()).min(1, 'At least one image ID required'),
});

export const updateImageSchema = z.object({
  altText: z.string().trim().max(200).optional().nullable(),
});
