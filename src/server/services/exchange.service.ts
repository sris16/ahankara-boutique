import { prisma } from '@/lib/prisma';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors';
import { ExchangeStatus, UserRole } from '@prisma/client';
import { PostPurchaseService } from './post-purchase.service';

export class ExchangeService {
  /**
   * Create an exchange request
   */
  static async createExchangeRequest(
    orderId: string, 
    userId: string, 
    data: { items: { orderItemId: string, quantity: number, replacementVariantId: string }[], reason?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: true }
    });

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) throw new ForbiddenError('Not your order');

    const RETURN_WINDOW_DAYS = 7;
    const deliveredShipments = order.shipments.filter(s => !!s.deliveredAt);
    if (deliveredShipments.length === 0) {
      throw new ForbiddenError('Exchanges can only be requested after delivery');
    }

    const latestDeliveryDate = new Date(Math.max(...deliveredShipments.map(s => s.deliveredAt!.getTime())));
    const returnDeadline = new Date(latestDeliveryDate.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    
    if (new Date() > returnDeadline) {
      throw new ForbiddenError('Exchange window has expired');
    }

    return await prisma.$transaction(async (tx) => {
      const exchangeReq = await tx.exchangeRequest.create({
        data: {
          orderId,
          userId,
          reason: data.reason,
          status: ExchangeStatus.REQUESTED
        }
      });

      for (const reqItem of data.items) {
        const eligibility = await PostPurchaseService.getItemEligibility(reqItem.orderItemId);
        if (reqItem.quantity > eligibility.remainingEligibleQuantity) {
          throw new ConflictError(`Requested exchange quantity (${reqItem.quantity}) exceeds eligible quantity (${eligibility.remainingEligibleQuantity}) for item`);
        }

        // Validate replacement variant exists
        const replacementVariant = await tx.productVariant.findUnique({
          where: { id: reqItem.replacementVariantId },
          include: { product: true }
        });
        if (!replacementVariant) throw new NotFoundError('Replacement variant not found');

        // Simple V12 policy check: exchange must be same product
        const originalItem = order.items.find(i => i.id === reqItem.orderItemId);
        if (!originalItem) throw new NotFoundError('Original order item not found');
        
        if (originalItem.productId !== replacementVariant.productId) {
           throw new ForbiddenError('V12 Policy: Exchange is only allowed for the same product (e.g. different size/color)');
        }

        await tx.exchangeItem.create({
          data: {
            exchangeRequestId: exchangeReq.id,
            orderItemId: reqItem.orderItemId,
            quantity: reqItem.quantity,
            replacementVariantId: reqItem.replacementVariantId
          }
        });
      }

      return await tx.exchangeRequest.findUnique({
        where: { id: exchangeReq.id },
        include: { items: true }
      });
    });
  }

  static async approveExchange(exchangeId: string) {
    return await prisma.$transaction(async (tx) => {
      // Lock exchange
      const ex = await tx.$queryRaw<{ id: string }[]>`SELECT * FROM "exchange_requests" WHERE id = ${exchangeId} FOR UPDATE`;
      if (!ex.length) throw new NotFoundError('Exchange request not found');
      
      const exchangeReq = await tx.exchangeRequest.findUnique({
        where: { id: exchangeId },
        include: { items: true }
      });

      if (exchangeReq!.status !== ExchangeStatus.REQUESTED) {
        throw new ConflictError('Only REQUESTED exchanges can be approved');
      }

      // Reserve stock for replacement
      for (const item of exchangeReq!.items) {
        // Decrease quantity, increase reserved for replacement item
        const result = await tx.$executeRaw`
          UPDATE "inventories"
          SET "quantity" = "quantity" - ${item.quantity},
              "reservedQuantity" = "reservedQuantity" + ${item.quantity},
              "updatedAt" = NOW()
          WHERE "variantId" = ${item.replacementVariantId} AND "quantity" >= ${item.quantity}
        `;
        if (result === 0) {
           throw new ConflictError(`Insufficient stock for replacement variant ${item.replacementVariantId}`);
        }
      }

      return await tx.exchangeRequest.update({
        where: { id: exchangeId },
        data: {
          status: ExchangeStatus.APPROVED,
          approvedAt: new Date()
        }
      });
    });
  }

  static async completeExchange(exchangeId: string) {
    // Receives the returned item and finalizes exchange
    return await prisma.$transaction(async (tx) => {
      const exchangeReq = await tx.exchangeRequest.findUnique({
        where: { id: exchangeId },
        include: { items: { include: { orderItem: true } } }
      });

      if (!exchangeReq) throw new NotFoundError('Exchange not found');
      if (exchangeReq.status !== ExchangeStatus.APPROVED) {
        throw new ConflictError('Exchange must be APPROVED to complete');
      }

      // Restore inventory for the originally purchased items
      for (const item of exchangeReq.items) {
        if (item.orderItem.variantId) {
          await tx.$executeRaw`
            UPDATE "inventories"
            SET "quantity" = "quantity" + ${item.quantity},
                "updatedAt" = NOW()
            WHERE "variantId" = ${item.orderItem.variantId}
          `;
        }

        // Finalize replacement reservation (decrement reserved since it's "shipped"/complete)
        await tx.$executeRaw`
            UPDATE "inventories"
            SET "reservedQuantity" = "reservedQuantity" - ${item.quantity},
                "updatedAt" = NOW()
            WHERE "variantId" = ${item.replacementVariantId}
        `;
      }

      return await tx.exchangeRequest.update({
        where: { id: exchangeId },
        data: {
          status: ExchangeStatus.COMPLETED,
          completedAt: new Date()
        }
      });
    });
  }
}
