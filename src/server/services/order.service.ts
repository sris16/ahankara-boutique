import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { checkoutSchema } from '../validators/checkout.validator';
import { CartService } from './cart.service';
import { InventoryService } from './inventory.service';
import { PricingService } from './pricing.service';

export class OrderService {
  // Config: 15 minutes
  private static readonly RESERVATION_DURATION_MINUTES = 15;

  private static generateOrderNumber(): string {
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 8);
    return `AHK-${dateStr}-${randomHex}`;
  }

  static async createCheckoutOrder(userId: string, data: unknown, idempotencyKey: string) {
    const validated = checkoutSchema.parse(data);

    // 1. Idempotency Check
    const existingOrder = await prisma.order.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
      }
    });

    if (existingOrder) {
      return existingOrder;
    }

    // 2. Validate Cart
    const cart = await CartService.getOrCreateCart(userId);
    if (cart.itemCount === 0) {
      throw new ValidationError('Cannot checkout an empty cart');
    }

    // Check for any issues in the evaluated cart (stale items, insufficient stock)
    for (const item of cart.items) {
      if (!item.availability.available) {
        throw new ValidationError(`Cart item ${item.variant.sku} is not available: ${item.availability.stockStatus}`);
      }
    }

    const pricing = await PricingService.calculateCheckoutPricing(userId, validated.couponCode);

    // 3. Validate Addresses
    const shippingAddress = await prisma.address.findFirst({
      where: { id: validated.shippingAddressId, userId },
    });
    if (!shippingAddress) {
      throw new NotFoundError('Shipping address not found or does not belong to user');
    }

    let billingAddress = shippingAddress;
    if (validated.billingAddressId && validated.billingAddressId !== validated.shippingAddressId) {
      const foundBilling = await prisma.address.findFirst({
        where: { id: validated.billingAddressId, userId },
      });
      if (!foundBilling) {
        throw new NotFoundError('Billing address not found or does not belong to user');
      }
      billingAddress = foundBilling;
    }

    // 4. Begin Atomic Transaction
    return await prisma.$transaction(async (tx) => {
      // Re-fetch idempotency to be absolutely sure within transaction lock
      const doubleCheck = await tx.order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        }
      });
      if (doubleCheck) return doubleCheck;

      // 4.1 Reserve Inventory for each item
      for (const item of cart.items) {
        try {
          await InventoryService.reserveStock(
            item.product.id,
            item.variant.id,
            { quantity: item.quantity, reference: 'CHECKOUT_RESERVATION' },
            tx
          );
        } catch (error) {
          throw new ValidationError(`Failed to reserve stock for ${item.variant.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 4.2 Create Address Snapshots
      const shippingSnapshot = await tx.orderAddress.create({
        data: {
          name: shippingAddress.fullName,
          phone: shippingAddress.phone,
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          landmark: shippingAddress.landmark,
        }
      });

      let billingSnapshotId = shippingSnapshot.id;
      if (billingAddress.id !== shippingAddress.id) {
        const billingSnapshot = await tx.orderAddress.create({
          data: {
            name: billingAddress.fullName,
            phone: billingAddress.phone,
            line1: billingAddress.addressLine1,
            line2: billingAddress.addressLine2,
            city: billingAddress.city,
            state: billingAddress.state,
            postalCode: billingAddress.postalCode,
            country: billingAddress.country,
            landmark: billingAddress.landmark,
          }
        });
        billingSnapshotId = billingSnapshot.id;
      }

      // 4.3 Create Order Items & Order
      const reservationExpiresAt = new Date();
      reservationExpiresAt.setMinutes(reservationExpiresAt.getMinutes() + OrderService.RESERVATION_DURATION_MINUTES);

      // Create Order
      let orderNumber = OrderService.generateOrderNumber();
      // Simple retry for order number collision (rare)
      let unique = false;
      while (!unique) {
        const exists = await tx.order.findUnique({ where: { orderNumber } });
        if (!exists) unique = true;
        else orderNumber = OrderService.generateOrderNumber();
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          idempotencyKey,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          subtotal: pricing.subtotal,
          shippingAmount: pricing.shippingAmount,
          discountAmount: pricing.discountAmount,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount, // Subtotal + shipping + tax - discount
          currency: 'INR',
          couponCode: pricing.coupon?.code || null,
          couponType: pricing.coupon?.type || null,
          couponValue: pricing.coupon?.value || null,
          reservationExpiresAt,
          shippingAddressId: shippingSnapshot.id,
          billingAddressId: billingSnapshotId,
          items: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: cart.items.map((item: any) => ({
              productId: item.product.id,
              variantId: item.variant.id,
              productName: item.product.name,
              productSlug: item.product.slug,
              sku: item.variant.sku,
              size: item.variant.size,
              color: item.variant.color,
              unitPrice: item.pricing.unitPrice,
              compareAtPrice: item.pricing.compareAtPrice,
              quantity: item.quantity,
              lineTotal: item.pricing.lineTotal,
            }))
          }
        },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
        }
      });

      return order;
    });
  }

  static async expirePendingOrders() {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        reservationExpiresAt: {
          lt: new Date()
        }
      },
      include: {
        items: true
      }
    });

    const results = { successful: 0, failed: 0 };

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Double check within transaction
          const check = await tx.order.findUnique({ where: { id: order.id } });
          if (!check || check.status !== 'PENDING_PAYMENT') return;

          // Release stock
          for (const item of order.items) {
            if (item.productId && item.variantId) {
              await InventoryService.releaseStock(
                item.productId,
                item.variantId,
                { quantity: item.quantity, reference: `ORDER_EXPIRY_${order.orderNumber}` },
                tx
              );
            }
          }

          // Mark order as EXPIRED
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'EXPIRED' }
          });
        });
        results.successful++;
      } catch (e) {
        console.error(`Failed to expire order ${order.id}:`, e);
        results.failed++;
      }
    }

    return results;
  }

  static async getCustomerOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getCustomerOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        cancellation: true,
        returnRequests: {
          include: { items: true }
        },
        exchangeRequests: {
          include: { items: true }
        },
        refunds: true,
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  static async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.order.count()
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getAdminOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}
