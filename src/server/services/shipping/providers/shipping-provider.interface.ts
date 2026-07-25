import { Order, OrderAddress, OrderItem, Shipment, ShipmentItem, ShippingProvider } from '@prisma/client';

export interface CreateProviderShipmentRequest {
  shipmentId: string;
  order: Order;
  shippingAddress: OrderAddress;
  items: (ShipmentItem & { orderItem: OrderItem })[];
}

export interface CreateProviderShipmentResponse {
  providerShipmentId: string;
  awb?: string;
  trackingNumber?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: Date;
}

export interface NormalizedTrackingEvent {
  providerEventId: string;
  status: import('@prisma/client').ShipmentStatus;
  message?: string;
  location?: string;
  eventTime: Date;
  rawPayload?: unknown;
}

export interface ShippingProviderAdapter {
  get providerType(): ShippingProvider;

  createShipment(request: CreateProviderShipmentRequest): Promise<CreateProviderShipmentResponse>;

  cancelShipment(providerShipmentId: string): Promise<void>;

  getTracking(providerShipmentId: string): Promise<NormalizedTrackingEvent[]>;
}
