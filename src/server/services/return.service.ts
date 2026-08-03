import { prisma } from '@/lib/prisma';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors';
import { Order, OrderItem, ReturnReason, ReturnStatus, UserRole } from '@prisma/client';
import { PostPurchaseService } from './post-purchase.service';
import { RefundService } from './refund.service';

export class ReturnService {
  /**
   * Customers can create a return request for delivered orders within the return window.
   */
  static async createReturnRequest(
    orderId: string, 
    userId: string, 
    data: { items: { orderItemId: string, quantity: number, reason: ReturnReason }[], customerNote?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: true }
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new ForbiddenError('Not your order');

    // Return policy: 7 days after delivery
    const RETURN_WINDOW_DAYS = 7;
    const deliveredShipments = order.shipments.filter(s => !!s.deliveredAt);
    if (deliveredShipments.length === 0) {
      throw new ForbiddenError('Returns can only be requested after delivery');
    }

    // Get latest delivery date
    const latestDeliveryDate = new Date(Math.max(...deliveredShipments.map(s => s.deliveredAt!.getTime())));
    const returnDeadline = new Date(latestDeliveryDate.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    
    if (new Date() > returnDeadline) {
      throw new ForbiddenError('Return window has expired');
    }

    return await prisma.$transaction(async (tx) => {
      // Create return request
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          userId,
          status: ReturnStatus.REQUESTED,
          customerNote: data.customerNote,
          reason: data.items[0].reason,
        }
      });

      for (const reqItem of data.items) {
        // Validate eligibility
        const eligibility = await PostPurchaseService.getItemEligibility(reqItem.orderItemId);
        
        if (reqItem.quantity > eligibility.remainingEligibleQuantity) {
          throw new ConflictError(`Requested return quantity (${reqItem.quantity}) exceeds eligible quantity (${eligibility.remainingEligibleQuantity}) for item`);
        }

        await tx.returnItem.create({
          data: {
            returnRequestId: returnRequest.id,
            orderItemId: reqItem.orderItemId,
            quantity: reqItem.quantity,
            reason: reqItem.reason,
          }
        });
      }

      return await tx.returnRequest.findUnique({
        where: { id: returnRequest.id },
        include: { items: true }
      });
    });
  }

  static async approveReturn(returnId: string) {
    return await prisma.$transaction(async (tx) => {
      const returnReq = await tx.returnRequest.findUnique({
        where: { id: returnId },
        include: { items: true }
      });

      if (!returnReq) throw new NotFoundError('Return request not found');
      if (returnReq.status !== ReturnStatus.REQUESTED) {
        throw new ConflictError('Only REQUESTED returns can be approved');
      }

      for (const item of returnReq.items) {
        await tx.returnItem.update({
          where: { id: item.id },
          data: { approvedQuantity: item.quantity }
        });
      }

      return await tx.returnRequest.update({
        where: { id: returnId },
        data: { 
          status: ReturnStatus.APPROVED,
          approvedAt: new Date()
        }
      });
    });
  }

  static async inspectAndAcceptReturn(returnId: string, itemInspections: { returnItemId: string, acceptedQuantity: number }[]) {
    return await prisma.$transaction(async (tx) => {
      const returnReq = await tx.returnRequest.findUnique({
        where: { id: returnId },
        include: { 
          items: { include: { orderItem: true } },
          order: { include: { items: true } }
        }
      });

      if (!returnReq) throw new NotFoundError('Return request not found');
      if (returnReq.status !== ReturnStatus.RECEIVED && returnReq.status !== ReturnStatus.APPROVED) {
         throw new ConflictError('Return must be received or approved before inspection');
      }

      let totalAccepted = 0;
      let totalRequested = 0;
      let totalRefundAmount = 0;

      for (const inspection of itemInspections) {
        const item = returnReq.items.find(i => i.id === inspection.returnItemId);
        if (!item) throw new NotFoundError(`Return item ${inspection.returnItemId} not found`);

        if (inspection.acceptedQuantity > item.quantity) {
          throw new ConflictError('Cannot accept more than requested quantity');
        }

        await tx.returnItem.update({
          where: { id: item.id },
          data: { 
            acceptedQuantity: inspection.acceptedQuantity,
            receivedQuantity: inspection.acceptedQuantity // Assume received = accepted for now
          }
        });

        totalRequested += item.quantity;
        totalAccepted += inspection.acceptedQuantity;

        if (inspection.acceptedQuantity > 0) {
          // Calculate refund for this accepted portion
          const refundAmount = PostPurchaseService.calculateItemRefundValue(
            returnReq.order,
            returnReq.order.items,
            item.orderItemId,
            inspection.acceptedQuantity
          );
          totalRefundAmount += refundAmount;

          // Restock inventory exactly once
          if (item.orderItem.variantId) {
            await tx.$executeRaw`
              UPDATE "inventories"
              SET "quantity" = "quantity" + ${inspection.acceptedQuantity},
                  "updatedAt" = NOW()
              WHERE "variantId" = ${item.orderItem.variantId}
            `;

            const inventory = await tx.inventory.findUnique({ where: { variantId: item.orderItem.variantId } });
            if (inventory) {
               await tx.inventoryTransaction.create({
                 data: {
                   inventoryId: inventory.id,
                   type: 'RETURN', 
                   quantityChange: inspection.acceptedQuantity,
                   quantityBefore: inventory.quantity - inspection.acceptedQuantity,
                   quantityAfter: inventory.quantity,
                   reservedBefore: inventory.reservedQuantity,
                   reservedAfter: inventory.reservedQuantity,
                   reason: 'Return Accepted',
                   reference: `RETURN_${returnId}`
                 }
               });
            }
          }
        }
      }

      let newStatus: ReturnStatus = ReturnStatus.REJECTED_AFTER_INSPECTION;
      if (totalAccepted === totalRequested) {
        newStatus = ReturnStatus.ACCEPTED;
      } else if (totalAccepted > 0) {
        newStatus = ReturnStatus.PARTIALLY_ACCEPTED;
      }

      const updatedRequest = await tx.returnRequest.update({
        where: { id: returnId },
        data: { 
          status: newStatus,
          inspectedAt: new Date(),
        }
      });

      if (totalRefundAmount > 0) {
         // Create Refund Liability securely via internal tx logic
         await tx.refund.create({
           data: {
             orderId: returnReq.orderId,
             returnRequestId: returnId,
             amount: totalRefundAmount,
             reason: 'Return accepted',
             idempotencyKey: `refund_return_${returnId}`,
             status: 'PENDING'
           }
         });
         await tx.returnRequest.update({
           where: { id: returnId },
           data: { status: ReturnStatus.REFUND_PENDING }
         });
      }

      return updatedRequest;
    });
  }
}
