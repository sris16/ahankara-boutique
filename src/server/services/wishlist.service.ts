import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { addToWishlistSchema, moveToCartSchema } from '../validators/wishlist.validator';
import { CartService } from './cart.service';

export class WishlistService {
  static async getWishlist(userId: string) {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: {
              include: { inventory: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return items.map(item => {
      const p = item.product;
      const activeVariants = p.variants.filter(v => v.isActive);
      
      const hasAvailableStock = activeVariants.some(v => 
        v.inventory && (v.inventory.quantity - v.inventory.reservedQuantity > 0)
      );

      let effectiveStartingPrice = p.basePrice;
      if (activeVariants.length > 0) {
        const prices = activeVariants.map(v => v.price !== null ? v.price : p.basePrice);
        effectiveStartingPrice = Math.min(...prices);
      }

      return {
        id: item.id,
        productId: p.id,
        name: p.name,
        slug: p.slug,
        primaryImage: p.images?.[0]?.secureUrl || null,
        effectiveStartingPrice,
        hasAvailableStock,
        createdAt: item.createdAt
      };
    });
  }

  static async addProduct(userId: string, data: unknown) {
    const validated = addToWishlistSchema.parse(data);

    const product = await prisma.product.findUnique({
      where: { id: validated.productId }
    });

    if (!product || product.status !== 'PUBLISHED') {
      throw new ValidationError('Product is unavailable');
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId: validated.productId } }
    });

    if (existing) {
      return { success: true, message: 'Already in wishlist', wishlistItem: existing };
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId,
        productId: validated.productId
      }
    });

    return { success: true, wishlistItem };
  }

  static async removeProduct(userId: string, wishlistItemId: string) {
    const item = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId }
    });

    if (!item || item.userId !== userId) {
      throw new NotFoundError('Wishlist item not found');
    }

    await prisma.wishlistItem.delete({ where: { id: wishlistItemId } });
    return { success: true };
  }

  static async moveToCart(userId: string, wishlistItemId: string, data: unknown) {
    const validated = moveToCartSchema.parse(data);

    const item = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      include: {
        product: {
          include: {
            variants: { where: { isActive: true } }
          }
        }
      }
    });

    if (!item || item.userId !== userId) {
      throw new NotFoundError('Wishlist item not found');
    }

    const product = item.product;
    let selectedVariantId = validated.variantId;

    if (!selectedVariantId) {
      if (product.variants.length === 1) {
        selectedVariantId = product.variants[0].id;
      } else {
        throw new ValidationError('Variant ID is required for products with multiple variants');
      }
    }

    // Verify the variant belongs to this product
    const variantBelongsToProduct = product.variants.some(v => v.id === selectedVariantId);
    if (!variantBelongsToProduct) {
      throw new ValidationError('Variant does not belong to this product');
    }

    // Attempt to add to cart
    await CartService.addItem(userId, { variantId: selectedVariantId, quantity: validated.quantity });

    // If successful, remove from wishlist
    await prisma.wishlistItem.delete({ where: { id: wishlistItemId } });

    return { success: true };
  }
}
