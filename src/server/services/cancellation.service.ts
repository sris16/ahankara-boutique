import { prisma } from '@/lib/prisma';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors';
import { 
  CancellationInitiator, 
  CancellationStatus, 
  Order, 
  OrderStatus, 
  PaymentStatus, 
  UserRole, 
  FulfillmentStatus, 
  ShipmentStatus 
} from '@prisma/client';

export class CancellationService {
  /**
   * Evaluates whether an order is eligible for cancellation by a customer.
   */
  static async checkCancellationEligibility(order: Order, role: UserRole) {
    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictError('Order is already cancelled');
    }

    if (order.status === OrderStatus.EXPIRED) {
      throw new ConflictError('Order is already expired');
    }

    if (role === UserRole.CUSTOMER) {
      // Customers cannot cancel if fulfillment has progressed beyond PROCESSING
      const irreversibleFulfillmentStatuses = [
        FulfillmentStatus.PARTIALLY_FULFILLED,
        FulfillmentStatus.FULFILLED,
        FulfillmentStatus.DELIVERED,
      ];

      if (irreversibleFulfillmentStatuses.includes(order.fulfillmentStatus)) {
        throw new ForbiddenError('Order cannot be cancelled as it is already being fulfilled or shipped');
      }

      // Check if there are any shipments that are beyond READY_TO_SHIP
      const shipments = await prisma.shipment.findMany({ where: { orderId: order.id } });
      const irreversibleShipmentStatuses = [
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.DELIVERY_ATTEMPTED,
        ShipmentStatus.DELIVERY_FAILED
      ];
      
      const hasIrreversibleShipment = shipments.some(s => irreversibleShipmentStatuses.includes(s.status));
      if (hasIrreversibleShipment) {
        throw new ForbiddenError('Order cannot be cancelled because a shipment is already in transit');
      }
    }
  }

  static async cancelOrder(
    orderId: string, 
    userId: string, 
    role: UserRole, 
    data: { reason?: string, note?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      }
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (role === UserRole.CUSTOMER && order.userId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel this order');
    }

    await this.checkCancellationEligibility(order, role);

    // Concurrency control using transaction
    return await prisma.$transaction(async (tx) => {
      // Lock the order
      const lockedOrder = await tx.$queryRaw<{ id: string, status: string, paymentStatus: string, fulfillmentStatus: string }[]>`
        SELECT id, "status", "paymentStatus", "fulfillmentStatus" 
        FROM "orders" 
        WHERE id = ${order.id} 
        FOR UPDATE
      `;

      if (!lockedOrder.length || lockedOrder[0].status === OrderStatus.CANCELLED) {
        throw new ConflictError('Order is already cancelled or unavailable');
      }

      const existingCancellation = await tx.orderCancellation.findUnique({
        where: { orderId: order.id }
      });

      if (existingCancellation) {
        throw new ConflictError('A cancellation request already exists for this order');
      }

      const initiator = role === UserRole.ADMIN ? CancellationInitiator.ADMIN : CancellationInitiator.CUSTOMER;

      const cancellation = await tx.orderCancellation.create({
        data: {
          orderId: order.id,
          requestedByUserId: userId,
          initiator,
          reason: data.reason,
          note: data.note,
          status: CancellationStatus.COMPLETED,
          processedAt: new Date(),
        }
      });

      // Update Order Status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          fulfillmentStatus: FulfillmentStatus.CANCELLED,
        }
      });

      // Cancel pending shipments
      await tx.shipment.updateMany({
        where: {
          orderId: order.id,
          status: {
            in: [ShipmentStatus.PENDING, ShipmentStatus.READY_TO_SHIP, ShipmentStatus.SHIPMENT_CREATED, ShipmentStatus.PICKUP_SCHEDULED]
          }
        },
        data: {
          status: ShipmentStatus.CANCELLED,
          cancelledAt: new Date()
        }
      });

      // Handle Inventory & Refunds
      if (order.paymentStatus === PaymentStatus.PENDING || order.paymentStatus === PaymentStatus.FAILED) {
        // CASE A: Unpaid Order
        // Release reservation exactly once
        for (const item of order.items) {
          if (item.variantId) {
            await tx.$executeRaw`
              UPDATE "inventories"
              SET "reservedQuantity" = "reservedQuantity" - ${item.quantity},
                  "updatedAt" = NOW()
              WHERE "variantId" = ${item.variantId} AND "reservedQuantity" >= ${item.quantity}
            `;
            
            // Create InventoryTransaction for Reservation Release
            const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
            if (inventory) {
               await tx.inventoryTransaction.create({
                 data: {
                   inventoryId: inventory.id,
                   type: 'RESERVATION_RELEASE',
                   quantityChange: -item.quantity,
                   quantityBefore: inventory.quantity,
                   quantityAfter: inventory.quantity,
                   reservedBefore: inventory.reservedQuantity + item.quantity,
                   reservedAfter: inventory.reservedQuantity,
                   reason: 'Order Cancelled (Unpaid)',
                   reference: `ORDER_CANCEL_${order.id}`
                 }
               });
            }
          }
        }
      } else if (order.paymentStatus === PaymentStatus.PAID) {
        // CASE B: Paid but not shipped completely
        // Create Refund liability
        await tx.refund.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount, // full refund for order cancellation
            reason: data.reason || 'Order Cancelled by Customer',
            status: 'PENDING',
            idempotencyKey: `cancel_refund_${order.id}`
          }
        });

        // Restore inventory for unshipped items (in this case, all items since we checked eligibility)
        // If it was already marked as SALE, we create a RETURN transaction to restore stock
        for (const item of order.items) {
          if (item.variantId) {
            await tx.$executeRaw`
              UPDATE "inventories"
              SET "quantity" = "quantity" + ${item.quantity},
                  "updatedAt" = NOW()
              WHERE "variantId" = ${item.variantId}
            `;

            const inventory = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
            if (inventory) {
               await tx.inventoryTransaction.create({
                 data: {
                   inventoryId: inventory.id,
                   type: 'RETURN', // Logical return to stock
                   quantityChange: item.quantity,
                   quantityBefore: inventory.quantity - item.quantity,
                   quantityAfter: inventory.quantity,
                   reservedBefore: inventory.reservedQuantity,
                   reservedAfter: inventory.reservedQuantity,
                   reason: 'Order Cancelled (Paid)',
                   reference: `ORDER_CANCEL_RESTOCK_${order.id}`
                 }
               });
            }
          }
        }
      }

      return cancellation;
    });
  }
}
