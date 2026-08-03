import { prisma } from '@/lib/prisma';
import { ShipmentStatus, ShippingProvider, FulfillmentStatus, OrderStatus } from '@prisma/client';
import { ValidationError, ConflictError } from '@/utils/errors';
import { ShippingProviderAdapter, NormalizedTrackingEvent } from './shipping/providers/shipping-provider.interface';
import { MockShippingProvider } from './shipping/providers/mock-shipping.provider';
import { ShiprocketShippingProvider } from './shipping/providers/shiprocket.provider';

export class ShippingService {
  private static getProviderAdapter(provider: ShippingProvider): ShippingProviderAdapter {
    switch (provider) {
      case ShippingProvider.MOCK:
        return new MockShippingProvider();
      case ShippingProvider.SHIPROCKET:
        return new ShiprocketShippingProvider();
      default:
        throw new Error(`Provider ${provider} adapter not implemented`);
    }
  }

  /**
   * Evaluates if a given shipment status transition is logically valid.
   */
  private static isValidTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
    const order: Record<ShipmentStatus, number> = {
      PENDING: 0,
      READY_TO_SHIP: 1,
      SHIPMENT_CREATED: 2,
      PICKUP_SCHEDULED: 3,
      PICKED_UP: 4,
      IN_TRANSIT: 5,
      OUT_FOR_DELIVERY: 6,
      DELIVERED: 7,
      DELIVERY_ATTEMPTED: 7,
      DELIVERY_FAILED: 8,
      RTO_INITIATED: 8,
      RTO_IN_TRANSIT: 9,
      RTO_DELIVERED: 10,
      CANCELLED: 99
    };
    
    // Ignore out-of-order retrogressions (e.g. DELIVERED back to IN_TRANSIT)
    // unless it's a special reset mechanism, which we don't have.
    if (order[next] < order[current] && current !== ShipmentStatus.DELIVERY_ATTEMPTED) {
      return false;
    }
    if (current === ShipmentStatus.DELIVERED) {
      return false;
    }
    if (current === ShipmentStatus.CANCELLED) {
      return false;
    }
    return true;
  }

  /**
   * Syncs Order fulfillment status based on its shipments
   */
  private static async syncOrderFulfillmentStatus(orderId: string, tx: import('@prisma/client').Prisma.TransactionClient = prisma as unknown as import('@prisma/client').Prisma.TransactionClient) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipments: {
          include: { items: true }
        }
      }
    });

    if (!order) return;

    let totalOrdered = 0;
    let totalShipped = 0;
    let totalDelivered = 0;
    let anyCancelled = false;

    for (const item of order.items) {
      totalOrdered += item.quantity;
    }

    for (const shipment of order.shipments) {
      if (shipment.status === ShipmentStatus.CANCELLED) {
        anyCancelled = true;
        continue;
      }
      for (const sItem of shipment.items) {
        totalShipped += sItem.quantity;
        if (shipment.status === ShipmentStatus.DELIVERED) {
          totalDelivered += sItem.quantity;
        }
      }
    }

    let newStatus: FulfillmentStatus = FulfillmentStatus.UNFULFILLED;

    if (totalDelivered === totalOrdered && totalOrdered > 0) {
      newStatus = FulfillmentStatus.DELIVERED;
    } else if (totalShipped === totalOrdered && totalOrdered > 0) {
      newStatus = FulfillmentStatus.FULFILLED;
    } else if (totalShipped > 0) {
      newStatus = FulfillmentStatus.PARTIALLY_FULFILLED;
    }

    if (order.fulfillmentStatus !== newStatus) {
      await tx.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: newStatus }
      });
    }
  }

  public static async createShipment(
    orderId: string,
    itemsToShip: { orderItemId: string; quantity: number }[],
    providerType: ShippingProvider = ShippingProvider.MOCK
  ) {
    if (itemsToShip.length === 0) {
      throw new ValidationError('Shipment must contain at least one item');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lock the order items for fulfillment checks
      const orderItems = await tx.$queryRaw<{ id: string, quantity: number, sku: string }[]>`SELECT * FROM order_items WHERE "orderId" = ${orderId} FOR UPDATE`;
      if (orderItems.length === 0) {
        throw new ValidationError('Order not found or has no items');
      }

      // 2. Validate Order state
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { shippingAddress: true, shipments: { include: { items: true } } }
      });

      if (!order) throw new ValidationError('Order not found');
      if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
        throw new ConflictError(`Cannot create shipment for order in ${order.status} state`);
      }
      if (!order.shippingAddress) {
        throw new ConflictError('Order lacks a shipping address snapshot');
      }

      // 3. Validate Quantities (prevent over-fulfillment)
      for (const requestedItem of itemsToShip) {
        const orderItem = orderItems.find(oi => oi.id === requestedItem.orderItemId);
        if (!orderItem) {
          throw new ValidationError(`Order item ${requestedItem.orderItemId} does not belong to this order`);
        }

        let currentlyAllocated = 0;
        for (const shipment of order.shipments) {
          if (shipment.status !== ShipmentStatus.CANCELLED) {
            const sItem = shipment.items.find(si => si.orderItemId === requestedItem.orderItemId);
            if (sItem) {
              currentlyAllocated += sItem.quantity;
            }
          }
        }

        if (currentlyAllocated + requestedItem.quantity > orderItem.quantity) {
          throw new ConflictError(`Cannot over-fulfill order item ${orderItem.sku}. Requested: ${requestedItem.quantity}, Available: ${orderItem.quantity - currentlyAllocated}`);
        }
      }

      // 4. Create internal Shipment record
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          provider: providerType,
          status: ShipmentStatus.PENDING,
          items: {
            create: itemsToShip.map(item => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity
            }))
          }
        },
        include: { items: { include: { orderItem: true } } }
      });

      // 5. Call Provider Adapter
      const adapter = this.getProviderAdapter(providerType);
      
      const providerRequest = {
        shipmentId: shipment.id,
        order,
        shippingAddress: order.shippingAddress,
        items: shipment.items
      };

      const providerResponse = await adapter.createShipment(providerRequest);

      // 6. Update Shipment with Provider Data
      const updatedShipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: ShipmentStatus.SHIPMENT_CREATED,
          providerShipmentId: providerResponse.providerShipmentId,
          awb: providerResponse.awb,
          trackingNumber: providerResponse.trackingNumber,
          courierName: providerResponse.courierName,
          trackingUrl: providerResponse.trackingUrl,
          estimatedDeliveryAt: providerResponse.estimatedDeliveryAt
        },
        include: { items: true }
      });

      // 7. Initial Tracking Event
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.SHIPMENT_CREATED,
          eventTime: new Date(),
          message: 'Shipment registered internally'
        }
      });

      await this.syncOrderFulfillmentStatus(orderId, tx);

      return updatedShipment;
    });
  }

  public static async cancelShipment(shipmentId: string) {
    return await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: { items: true }
      });

      if (!shipment) throw new ValidationError('Shipment not found');

      if (!this.isValidTransition(shipment.status, ShipmentStatus.CANCELLED)) {
        throw new ConflictError(`Cannot cancel shipment in ${shipment.status} state`);
      }

      const adapter = this.getProviderAdapter(shipment.provider);
      if (shipment.providerShipmentId) {
        await adapter.cancelShipment(shipment.providerShipmentId);
      }

      const cancelled = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: ShipmentStatus.CANCELLED,
          cancelledAt: new Date()
        }
      });

      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: ShipmentStatus.CANCELLED,
          eventTime: new Date(),
          message: 'Shipment cancelled'
        }
      });

      await this.syncOrderFulfillmentStatus(shipment.orderId, tx);

      return cancelled;
    });
  }

  public static async processTrackingEvent(shipmentId: string, event: NormalizedTrackingEvent) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check for duplicate providerEventId
      if (event.providerEventId) {
        const existing = await tx.shipmentTrackingEvent.findUnique({
          where: { providerEventId: event.providerEventId }
        });
        if (existing) {
          // Idempotent success
          return tx.shipment.findUnique({ where: { id: shipmentId } });
        }
      }

      const shipment = await tx.shipment.findUnique({ where: { id: shipmentId } });
      if (!shipment) throw new ValidationError('Shipment not found');

      // 2. Persist Tracking Event
      await tx.shipmentTrackingEvent.create({
        data: {
          shipmentId,
          providerEventId: event.providerEventId,
          status: event.status,
          message: event.message,
          location: event.location,
          eventTime: event.eventTime,
          rawProviderStatus: event.rawPayload || {}
        }
      });

      // 3. Update Shipment Status safely
      if (this.isValidTransition(shipment.status, event.status)) {
        const updateData: Record<string, unknown> = { status: event.status };
        
        if (event.status === ShipmentStatus.DELIVERED && !shipment.deliveredAt) {
          updateData.deliveredAt = event.eventTime;
        } else if (event.status === ShipmentStatus.SHIPMENT_CREATED && !shipment.shippedAt) {
          updateData.shippedAt = event.eventTime;
        }

        await tx.shipment.update({
          where: { id: shipmentId },
          data: updateData
        });

        await this.syncOrderFulfillmentStatus(shipment.orderId, tx);
      }

      return await tx.shipment.findUnique({ where: { id: shipmentId } });
    });
  }
}
