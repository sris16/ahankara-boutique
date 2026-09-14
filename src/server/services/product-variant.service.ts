import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/utils/errors';
import { createProductVariantSchema, updateProductVariantSchema } from '../validators/product-variant.validator';


export class ProductVariantService {
  static async createVariant(productId: string, data: unknown) {
    const validated = createProductVariantSchema.parse(data);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');

    const existingSku = await prisma.productVariant.findUnique({ where: { sku: validated.sku } });
    if (existingSku) throw new ConflictError('A variant with this SKU already exists');

    const existingLogical = await prisma.productVariant.findFirst({
      where: {
        productId,
        size: validated.size,
        color: validated.color
      }
    });
    if (existingLogical) throw new ConflictError('A variant with this size and color already exists for this product');

    return prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: validated.sku,
          size: validated.size,
          color: validated.color,
          price: validated.price,
          compareAtPrice: validated.compareAtPrice,
          weightInGrams: validated.weightInGrams,
          lengthCm: validated.lengthCm,
          breadthCm: validated.breadthCm,
          heightCm: validated.heightCm,
          isActive: validated.isActive !== undefined ? validated.isActive : true,
          inventory: {
            create: {
              quantity: validated.quantity || 0,
              reservedQuantity: 0,
              lowStockThreshold: validated.lowStockThreshold || 0,
              transactions: {
                create: {
                  type: 'RESTOCK',
                  quantityChange: validated.quantity || 0,
                  quantityBefore: 0,
                  quantityAfter: validated.quantity || 0,
                  reservedBefore: 0,
                  reservedAfter: 0,
                  reason: 'Initial variant creation'
                }
              }
            }
          }
        },
        include: { inventory: true }
      });
      return variant;
    });
  }

  static async updateVariant(productId: string, variantId: string, data: unknown) {
    const validated = updateProductVariantSchema.parse(data);

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      include: { inventory: true }
    });
    if (!variant) throw new NotFoundError('Variant not found for this product');

    if (validated.sku && validated.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({ where: { sku: validated.sku } });
      if (existingSku) throw new ConflictError('A variant with this SKU already exists');
    }

    if (validated.size !== undefined || validated.color !== undefined) {
      const newSize = validated.size !== undefined ? validated.size : variant.size;
      const newColor = validated.color !== undefined ? validated.color : variant.color;
      
      if (newSize !== variant.size || newColor !== variant.color) {
        const existingLogical = await prisma.productVariant.findFirst({
          where: {
            productId,
            size: newSize,
            color: newColor,
            id: { not: variantId }
          }
        });
        if (existingLogical) throw new ConflictError('A variant with this size and color already exists for this product');
      }
    }

    return prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          sku: validated.sku,
          size: validated.size !== undefined ? validated.size : undefined,
          color: validated.color !== undefined ? validated.color : undefined,
          price: validated.price !== undefined ? validated.price : undefined,
          compareAtPrice: validated.compareAtPrice !== undefined ? validated.compareAtPrice : undefined,
          isActive: validated.isActive !== undefined ? validated.isActive : undefined,
          weightInGrams: validated.weightInGrams !== undefined ? validated.weightInGrams : undefined,
          lengthCm: validated.lengthCm !== undefined ? validated.lengthCm : undefined,
          breadthCm: validated.breadthCm !== undefined ? validated.breadthCm : undefined,
          heightCm: validated.heightCm !== undefined ? validated.heightCm : undefined,
        },
        include: { inventory: true }
      });

      if (validated.lowStockThreshold !== undefined && variant.inventory) {
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: { lowStockThreshold: validated.lowStockThreshold }
        });
        updatedVariant.inventory!.lowStockThreshold = validated.lowStockThreshold;
      }

      return updatedVariant;
    });
  }

  static async getVariantsByProductId(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      include: { inventory: true },
      orderBy: [ { color: 'asc' }, { size: 'asc' } ]
    });
  }

  static async getVariantById(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      include: { inventory: true }
    });
    if (!variant) throw new NotFoundError('Variant not found');
    return variant;
  }

  static async deleteVariant(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId }
    });
    if (!variant) throw new NotFoundError('Variant not found');

    return prisma.productVariant.delete({
      where: { id: variantId }
    });
  }
}
