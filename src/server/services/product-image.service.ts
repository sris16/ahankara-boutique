import { prisma } from '@/lib/prisma';
import { CloudinaryService } from './cloudinary.service';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { reorderImagesSchema } from '../validators/product-image.validator';

const MAX_IMAGES_PER_PRODUCT = 10;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class ProductImageService {
  /**
   * Validate and upload a new product image
   */
  static async uploadImage(productId: string, file: File) {
    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      include: { images: true }
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.images.length >= MAX_IMAGES_PER_PRODUCT) {
      throw new ValidationError(`Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product`);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(`File size exceeds 5MB limit`);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      throw new ValidationError('Invalid file format. Only JPEG, PNG, and WebP are allowed.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let uploadResult;
    try {
      uploadResult = await CloudinaryService.uploadProductImage(buffer, productId, file.type);
    } catch (e: unknown) {
      throw new Error(`Cloudinary upload failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Determine sort order and if it should be primary
    const isPrimary = product.images.length === 0;
    const sortOrder = product.images.length > 0 
      ? Math.max(...product.images.map(img => img.sortOrder)) + 1 
      : 0;

    try {
      return await prisma.productImage.create({
        data: {
          productId,
          url: uploadResult.url,
          secureUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          sortOrder,
          isPrimary
        }
      });
    } catch {
      // Best-effort cleanup of orphan Cloudinary asset
      await CloudinaryService.deleteImage(uploadResult.public_id);
      throw new Error('Failed to save image metadata to database. Upload reverted.');
    }
  }

  /**
   * Set an image as the primary image for a product
   */
  static async setPrimaryImage(productId: string, imageId: string) {
    const product = await prisma.product.findUnique({ 
      where: { id: productId },
      include: { images: true }
    });
    if (!product) throw new NotFoundError('Product not found');

    const imageExists = product.images.find(img => img.id === imageId);
    if (!imageExists) throw new NotFoundError('Image not found for this product');

    return prisma.$transaction(async (tx) => {
      // unset current primary
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false }
      });
      
      // set new primary
      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true }
      });
    });
  }

  /**
   * Delete an image
   */
  static async deleteImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    
    if (!image || image.productId !== productId) {
      throw new NotFoundError('Image not found for this product');
    }

    // Attempt Cloudinary delete
    const deletedInCloudinary = await CloudinaryService.deleteImage(image.publicId);
    if (!deletedInCloudinary) {
      // In a real system, you might enqueue this to a background retry job. 
      // For V5, we throw an error to avoid data desync.
      throw new Error('Failed to delete asset from Cloudinary');
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    // Handle primary image reassignment if the deleted image was primary
    if (image.isPrimary) {
      const remainingImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: 'asc' }
      });

      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true }
        });
      }
    }

    return { success: true };
  }

  /**
   * Reorder images
   */
  static async reorderImages(productId: string, data: unknown) {
    const { orderedImageIds } = reorderImagesSchema.parse(data);

    // Verify ownership
    const existingImages = await prisma.productImage.findMany({ where: { productId } });
    const existingIds = existingImages.map(img => img.id);

    for (const id of orderedImageIds) {
      if (!existingIds.includes(id)) {
        throw new ValidationError(`Image ${id} does not belong to this product`);
      }
    }

    return prisma.$transaction(async (tx) => {
      const updates = orderedImageIds.map((id, index) => {
        return tx.productImage.update({
          where: { id },
          data: { sortOrder: index }
        });
      });
      return Promise.all(updates);
    });
  }
}
