import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/utils/errors';
import { CouponType } from '@prisma/client';

export class PricingService {
  /**
   * Calculates the authoritative checkout pricing for a user's cart,
   * optionally applying a coupon code.
   */
  static async calculateCheckoutPricing(userId: string, couponCode?: string | null) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    collections: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      const price = item.variant.price ?? item.variant.product.basePrice;
      subtotal += price * item.quantity;
    });

    let discountAmount = 0;
    let eligibleSubtotal = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const normalizedCode = couponCode.toUpperCase().trim();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
        include: {
          products: true,
          categories: true,
          collections: true,
        }
      });

      if (!coupon) {
        throw new ValidationError('Invalid coupon code');
      }

      if (!coupon.isActive) {
        throw new ValidationError('Coupon is inactive');
      }

      const now = new Date();
      if (coupon.startsAt && now < coupon.startsAt) {
        throw new ValidationError('Coupon is not valid yet');
      }
      if (coupon.endsAt && now > coupon.endsAt) {
        throw new ValidationError('Coupon has expired');
      }

      // Check global limits
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new ValidationError('Coupon usage limit reached');
      }

      // Check per-user limits
      if (coupon.usageLimitPerUser !== null) {
        const userUsage = await prisma.couponRedemption.count({
          where: { couponId: coupon.id, userId }
        });
        if (userUsage >= coupon.usageLimitPerUser) {
          throw new ValidationError('You have exceeded the usage limit for this coupon');
        }
      }

      // Determine eligible subtotal based on scope
      const isGlobal = coupon.products.length === 0 && coupon.categories.length === 0 && coupon.collections.length === 0;

      cart.items.forEach(item => {
        const price = item.variant.price ?? item.variant.product.basePrice;
        let isEligible = isGlobal;

        if (!isEligible) {
          // check product
          if (coupon.products.some((cp: { productId: string }) => cp.productId === item.variant.product.id)) {
            isEligible = true;
          }
          // check category
          else if (coupon.categories.some((cc: { categoryId: string }) => cc.categoryId === item.variant.product.categoryId)) {
            isEligible = true;
          }
          // check collection
          else if (coupon.collections.some((cc: { collectionId: string }) => item.variant.product.collections.some((pc: { collectionId: string }) => pc.collectionId === cc.collectionId))) {
            isEligible = true;
          }
        }

        if (isEligible) {
          eligibleSubtotal += price * item.quantity;
        }
      });

      if (eligibleSubtotal === 0) {
        throw new ValidationError('Coupon is not applicable to any items in your cart');
      }

      if (coupon.minimumOrderAmount > 0 && eligibleSubtotal < coupon.minimumOrderAmount) {
        throw new ValidationError('Minimum eligible order amount not met for this coupon');
      }

      if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = Math.round((eligibleSubtotal * coupon.value) / 100);
        if (coupon.maximumDiscountAmount !== null && discountAmount > coupon.maximumDiscountAmount) {
          discountAmount = coupon.maximumDiscountAmount;
        }
      } else if (coupon.type === CouponType.FIXED_AMOUNT) {
        discountAmount = coupon.value;
      }

      // Discount cannot exceed eligible amount
      if (discountAmount > eligibleSubtotal) {
        discountAmount = eligibleSubtotal;
      }

      appliedCoupon = {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      };
    }

    const discountedSubtotal = subtotal - discountAmount;
    
    // Future placeholders
    const shippingAmount = 0;
    const taxAmount = 0;
    const totalAmount = discountedSubtotal + shippingAmount + taxAmount;

    return {
      subtotal,
      eligibleSubtotal,
      discountAmount,
      discountedSubtotal,
      shippingAmount,
      taxAmount,
      totalAmount,
      coupon: appliedCoupon
    };
  }
}
