import { prisma } from '@/lib/prisma';
import { AppError, ConflictError, NotFoundError } from '@/utils/errors';
import { RefundStatus, Order } from '@prisma/client';

export class RefundService {
  /**
   * Safe calculation of maximum allowable refund for an order.
   */
  static async getMaximumRefundableAmount(orderId: string): Promise<number> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        refunds: {
          where: {
            status: { in: [RefundStatus.SUCCEEDED, RefundStatus.PENDING, RefundStatus.PROCESSING] }
          }
        }
      }
    });

    if (!order) throw new NotFoundError('Order not found');

    const totalRefundedOrPending = order.refunds.reduce((sum, r) => sum + r.amount, 0);
    return Math.max(0, order.totalAmount - totalRefundedOrPending);
  }

  /**
   * Processes a pending refund.
   * Uses idempotency and concurrency controls to prevent duplicate refunds.
   */
  static async processRefund(refundId: string) {
    return await prisma.$transaction(async (tx) => {
      // Lock the refund record
      const lockedRefunds = await tx.$queryRaw<{ id: string, amount: number, status: string, orderId: string }[]>`
        SELECT id, amount, "status", "orderId" 
        FROM "refunds" 
        WHERE id = ${refundId} 
        FOR UPDATE
      `;

      if (!lockedRefunds.length) throw new NotFoundError('Refund not found');
      
      const refund = lockedRefunds[0];
      if (refund.status !== RefundStatus.PENDING) {
        throw new ConflictError(`Refund cannot be processed from status: ${refund.status}`);
      }

      // Check max refundable limit
      // Exclude this specific refund ID from the sum because we are processing it
      const existingRefunds = await tx.refund.findMany({
        where: {
          orderId: refund.orderId,
          id: { not: refundId },
          status: { in: [RefundStatus.SUCCEEDED, RefundStatus.PENDING, RefundStatus.PROCESSING] }
        }
      });
      const order = await tx.order.findUnique({ where: { id: refund.orderId }});
      
      const totalRefundedOrPending = existingRefunds.reduce((sum, r) => sum + r.amount, 0);
      const remainingLimit = order!.totalAmount - totalRefundedOrPending;

      if (refund.amount > remainingLimit) {
        await tx.refund.update({
          where: { id: refundId },
          data: { 
            status: RefundStatus.FAILED, 
            failureReason: 'Refund amount exceeds maximum allowable limit' 
          }
        });
        throw new ConflictError('Refund amount exceeds maximum allowable limit');
      }

      await tx.refund.update({
        where: { id: refundId },
        data: { status: RefundStatus.PROCESSING }
      });

      // MOCK PROVIDER CALL
      // In reality, here we would call Razorpay: 
      // const rzpRefund = await razorpay.refunds.create({ amount: refund.amount, receipt: refund.id });
      
      // Assume success for mock testing
      const providerRefundId = `mock_rfnd_${Date.now()}`;

      const completedRefund = await tx.refund.update({
        where: { id: refundId },
        data: { 
          status: RefundStatus.SUCCEEDED,
          providerRefundId,
          processedAt: new Date()
        }
      });

      // If tied to a return, mark return as refunded
      const r = await tx.refund.findUnique({ where: { id: refundId }, select: { returnRequestId: true }});
      if (r?.returnRequestId) {
        await tx.returnRequest.update({
          where: { id: r.returnRequestId },
          data: { 
            status: 'REFUNDED', 
            completedAt: new Date() 
          }
        });
      }

      return completedRefund;
    });
  }
}
