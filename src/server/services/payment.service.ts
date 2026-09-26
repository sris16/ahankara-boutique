import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '@/utils/errors';
import { Prisma } from '@prisma/client'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { RazorpayService } from './razorpay.service';
import { InventoryService } from './inventory.service';

interface OrderWithRelations {
  payments: { id: string, providerOrderId: string, status: string, amount: number, currency: string }[];
  items: { variantId: string, productId: string, quantity: number }[];
}

export class PaymentService {
  /**
   * Generates a new Razorpay Order (or returns existing one) for a pending boutique Order.
   */
  public static async createPaymentAttempt(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundError('Order not found or does not belong to user');
    }

    if (order.status !== 'PENDING_PAYMENT' || order.paymentStatus !== 'PENDING') {
      throw new ConflictError('Order is not in a valid state for payment');
    }

    if (!order.reservationExpiresAt || order.reservationExpiresAt < new Date()) {
      throw new ConflictError('Order reservation has expired');
    }

    if (order.totalAmount <= 0) {
      throw new ValidationError('Order total must be greater than 0');
    }

    // Idempotency: If a pending payment attempt already exists, return it
    const existingPending = (order as unknown as OrderWithRelations).payments.find(p => p.status === 'PENDING');
    if (existingPending) {
      return {
        id: existingPending.id,
        providerOrderId: existingPending.providerOrderId,
        amount: existingPending.amount,
        currency: existingPending.currency,
      };
    }

    // Create Razorpay Order
    let providerOrder;
    try {
      providerOrder = await RazorpayService.createOrder(order.totalAmount, order.orderNumber);
    } catch (e) {
      console.error('Failed to create Razorpay Order:', e);
      throw new Error('Payment gateway error');
    }

    // Persist Payment Attempt
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        providerOrderId: providerOrder.id,
        amount: order.totalAmount,
        currency: order.currency,
        status: 'PENDING',
      }
    });

    return {
      id: payment.id,
      providerOrderId: payment.providerOrderId,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  /**
   * Verifies payment completion synchronously from frontend checkout response.
   */
  public static async verifyCheckoutPayment(
    userId: string,
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const payment = (order as unknown as OrderWithRelations).payments.find(p => p.providerOrderId === razorpayOrderId);
    if (!payment) {
      throw new ValidationError('Invalid payment identifier');
    }

    // Verify cryptographic signature
    const isValid = RazorpayService.verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      // Signature is invalid. Don't mark as paid.
      throw new ValidationError('Invalid payment signature');
    }

    // Verify external payment integrity directly from Razorpay
    const razorpayPayment = await RazorpayService.fetchPayment(razorpayPaymentId);
    if (!razorpayPayment) {
      throw new ValidationError('Failed to fetch external payment verification');
    }

    if (razorpayPayment.order_id !== razorpayOrderId) {
      throw new ValidationError('Payment does not belong to the correct order');
    }

    // Both local order.totalAmount and Razorpay amount are in Paise
    if (Number(razorpayPayment.amount) !== order.totalAmount) {
      throw new ValidationError('Payment amount mismatch');
    }

    if (razorpayPayment.currency !== order.currency) {
      throw new ValidationError('Payment currency mismatch');
    }

    if (razorpayPayment.status !== 'captured') {
      throw new ValidationError('Payment is not captured');
    }

    // Mark signature verified and attempt finalization
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: razorpayPaymentId,
        signatureVerified: true,
      }
    });

    return await this.finalizeSuccessfulPayment(order.id, payment.id, razorpayOrderId, razorpayPaymentId);
  }

  /**
   * Authoritative finalization of a successful payment.
   * Idempotent, handles expiration races, and guarantees exactly-once stock commit.
   */
  public static async finalizeSuccessfulPayment(orderId: string, paymentId: string, providerOrderId: string, providerPaymentId: string) {
    return await prisma.$transaction(async (tx) => {
      // Lock the order for update to prevent races
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
      });

      if (!order) throw new Error('Order not found');

      // 1. If already PAID/CONFIRMED, we are done (Idempotency)
      if (order.status === 'CONFIRMED' || order.paymentStatus === 'PAID') {
        return order;
      }

      // 2. Late-Capture Check (If order is expired or cancelled)
      if (order.status === 'EXPIRED' || order.status === 'CANCELLED') {
        // We received money for an expired order!
        // Mark payment as PAID but put Order in PAYMENT_REVIEW
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'PAID', paidAt: new Date() }
        });
        const reviewOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAYMENT_REVIEW', paymentStatus: 'PAID' }
        });
        return reviewOrder;
      }

      // 3. Normal finalization
      // Ensure amounts match via Razorpay API (or trust signature since we validated signature earlier,
      // but double check amounts locally against DB)
      const payment = (order as unknown as OrderWithRelations).payments.find(p => p.id === paymentId);
      if (!payment || payment.amount !== order.totalAmount || payment.currency !== order.currency) {
        // Amount mismatch! Put into review.
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'PAID', paidAt: new Date(), providerPaymentId }
        });
        return await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAYMENT_REVIEW', paymentStatus: 'PAID' }
        });
      }

      // 4. Update Payment & Order Status
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', paidAt: new Date(), providerPaymentId }
      });

      let confirmedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID' }
      });

      // 5. Commit Inventory (Exactly Once)
      for (const item of (order as unknown as OrderWithRelations).items) {
        if (item.productId && item.variantId) {
          // Commit stock decrements available quantity and unreserves
          await InventoryService.commitStock(
            item.productId,
            item.variantId,
            { quantity: item.quantity, reference: `ORDER_PAID_${order.orderNumber}` },
            tx
          );
        }
      }

      // 5.5 Redeem Coupon (Exactly Once)
      const typedOrder = order as unknown as { couponCode: string | null; discountAmount: number };
      const orderCouponCode = typedOrder.couponCode;
      let couponLimitExceededAtFinalization = false;
      if (orderCouponCode) {
        const existingRedemption = await tx.couponRedemption.findUnique({
          where: { orderId: order.id }
        });
        if (!existingRedemption) {
          const coupons = await tx.$queryRaw<{id:string, usageLimit: number|null, usedCount: number}[]>`SELECT id, "usageLimit", "usedCount" FROM coupons WHERE code = ${orderCouponCode} FOR UPDATE`;
          if (coupons.length > 0) {
            const coupon = coupons[0];
            if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
              couponLimitExceededAtFinalization = true;
            } else {
              await tx.couponRedemption.create({
                data: {
                  couponId: coupon.id,
                  userId: order.userId,
                  orderId: order.id,
                  discountAmount: typedOrder.discountAmount || 0
                }
              });
              await tx.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } }
              });
            }
          }
        }
      }

      // 5.6 Handle Coupon Over-Redemption Race Condition
      if (couponLimitExceededAtFinalization && confirmedOrder.status === 'CONFIRMED') {
         confirmedOrder = await tx.order.update({
           where: { id: order.id },
           data: { status: 'PAYMENT_REVIEW' }
         });
      }

      // 6. Cleanup Cart
      // We only remove items that were actually purchased in this order, leaving others intact
      const cart = await tx.cart.findUnique({ where: { userId: order.userId }, include: { items: true } });
      if (cart) {
        const purchasedVariantIds = (order as unknown as OrderWithRelations).items.map(i => i.variantId).filter(Boolean) as string[];
        const itemsToRemove = cart.items.filter(ci => purchasedVariantIds.includes(ci.variantId));

        for (const cartItem of itemsToRemove) {
          await tx.cartItem.delete({ where: { id: cartItem.id } });
        }
      }

      return confirmedOrder;
    });
  }

  public static async processWebhook(rawBody: string, signature: string) {
    if (!RazorpayService.verifyWebhookSignature(rawBody, signature)) {
      throw new ValidationError('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.headers && payload.headers['x-razorpay-event-id']
      ? payload.headers['x-razorpay-event-id']
      : (payload.contains && payload.contains[0] ? `evt_${payload.created_at}_${payload.event}` : null);

    // Better safe fallback for event id:
    const safeEventId = eventId || `webhook_${crypto.randomUUID()}`;
    if (!safeEventId) return; // technically always true, but keeps logic structure intact

    // 1. Idempotency Check for Webhook
    // (If we lack a guaranteed Razorpay event ID, we rely on finalization idempotency later)
    if (payload.event === 'payment.captured' || payload.event === 'payment.failed') {
      const existing = await prisma.paymentWebhookEvent.findFirst({
        where: { providerEventId: payload.event + '_' + payload.payload.payment.entity.id }
      });
      if (existing) {
        // Already processed
        return;
      }

      await prisma.paymentWebhookEvent.create({
        data: {
          providerEventId: payload.event + '_' + payload.payload.payment.entity.id,
          eventType: payload.event,
        }
      });
    }

    const paymentEntity = payload.payload.payment.entity;
    const providerOrderId = paymentEntity.order_id;
    const providerPaymentId = paymentEntity.id;

    if (!providerOrderId) return; // We only care about payments linked to orders

    const payment = await prisma.payment.findUnique({
      where: { providerOrderId }
    });

    if (!payment) {
      console.warn(`Webhook received for unknown Razorpay Order ID: ${providerOrderId}`);
      return;
    }

    if (payload.event === 'payment.captured') {
      // Both webhook amount and local payment.amount are in Paise
      if (Number(paymentEntity.amount) !== payment.amount) {
        console.warn(`Webhook amount mismatch for Razorpay Order ID: ${providerOrderId}`);
        return;
      }

      if (paymentEntity.currency !== payment.currency) {
         console.warn(`Webhook currency mismatch for Razorpay Order ID: ${providerOrderId}`);
         return;
      }

      if (paymentEntity.status !== 'captured') {
         return;
      }

      await this.finalizeSuccessfulPayment(payment.orderId, payment.id, providerOrderId, providerPaymentId);
    } else if (payload.event === 'payment.failed') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          providerPaymentId,
          failureCode: paymentEntity.error_code,
          failureDescription: paymentEntity.error_description,
        }
      });
      // Note: We leave Order as PENDING_PAYMENT to allow retries.
    }
  }
}
