import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

export class CartService {
  static async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 }
                  }
                },
                inventory: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: { where: { isPrimary: true }, take: 1 }
                    }
                  },
                  inventory: true
                }
              }
            }
          }
        }
      });
    }

    return this._evaluateCart(cart);
  }

  static async addItem(userId: string, data: unknown) {
    const validated = addToCartSchema.parse(data);

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Validate product/variant/stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      include: { product: true, inventory: true }
    });

    if (!variant || !variant.inventory) {
      throw new NotFoundError('Variant not found');
    }

    if (!variant.isActive || variant.product.status !== 'PUBLISHED') {
      throw new ValidationError('Variant is currently unavailable');
    }

    const availableQuantity = variant.inventory.quantity - variant.inventory.reservedQuantity;
    
    // Check existing item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: validated.variantId } }
    });

    const finalRequestedQuantity = (existingItem?.quantity || 0) + validated.quantity;

    if (finalRequestedQuantity > availableQuantity) {
      throw new ValidationError('Insufficient stock available');
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: finalRequestedQuantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: validated.variantId,
          quantity: validated.quantity
        }
      });
    }

    return this.getOrCreateCart(userId);
  }

  static async updateItemQuantity(userId: string, cartItemId: string, data: unknown) {
    const validated = updateCartItemSchema.parse(data);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        variant: { include: { inventory: true, product: true } }
      }
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    if (!item.variant || !item.variant.inventory || !item.variant.isActive || item.variant.product.status !== 'PUBLISHED') {
       throw new ValidationError('Variant is unavailable');
    }

    const availableQuantity = item.variant.inventory.quantity - item.variant.inventory.reservedQuantity;

    if (validated.quantity > availableQuantity) {
      throw new ValidationError('Insufficient stock available');
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: validated.quantity }
    });

    return this.getOrCreateCart(userId);
  }

  static async removeItem(userId: string, cartItemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundError('Cart not found');

    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.cartId !== cart.id) {
      throw new NotFoundError('Cart item not found');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    return { success: true };
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return { success: true };

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _evaluateCart(cart: any) {
    let subtotal = 0;
    let itemCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evaluatedItems = cart.items.map((item: any) => {
      const v = item.variant;
      const p = v.product;
      const inv = v.inventory;

      const unitPrice = v.price !== null ? v.price : p.basePrice;
      const compareAtPrice = v.compareAtPrice !== null ? v.compareAtPrice : p.compareAtPrice;
      const lineTotal = unitPrice * item.quantity;

      // Determine availability & issue
      let available = true;
      let issue: string | null = null;

      if (!v.isActive || p.status !== 'PUBLISHED') {
        available = false;
        issue = 'PRODUCT_UNAVAILABLE';
      } else {
        const availableQuantity = inv.quantity - inv.reservedQuantity;
        if (availableQuantity <= 0) {
          available = false;
          issue = 'OUT_OF_STOCK';
        } else if (availableQuantity < item.quantity) {
          available = false;
          issue = 'INSUFFICIENT_STOCK';
        }
      }

      // Add to totals if available, maybe? No, cart total should reflect all items, or only available?
      // "Checkout must reject until customer corrects the Cart." 
      // The prompt says "lineTotal = unitPrice * quantity". We include it in subtotal but the frontend warns them.
      subtotal += lineTotal;
      itemCount += item.quantity;

      return {
        cartItemId: item.id,
        quantity: item.quantity,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images?.[0]?.secureUrl || null
        },
        variant: {
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color
        },
        pricing: {
          unitPrice,
          compareAtPrice,
          lineTotal
        },
        availability: {
          available,
          stockStatus: issue || 'IN_STOCK' // stockStatus used for issue returning
        }
      };
    });

    return {
      id: cart.id,
      items: evaluatedItems,
      itemCount,
      subtotal
    };
  }
}
