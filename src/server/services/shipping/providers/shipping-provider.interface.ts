import { Order, OrderAddress, OrderItem, Shipment, ShipmentItem, ShippingProvider } from '@prisma/client';

export interface CreateProviderShipmentRequest {
  shipmentId: string;
  order: Order;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress | null;
  customerEmail: string;
  items: (ShipmentItem & { orderItem: OrderItem & { variant: import('@prisma/client').ProductVariant | null } })[];
}

export interface CreateProviderShipmentResponse {
  providerOrderId?: string;
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

export interface AssignAWBRequest {
  courierId?: string;
}

export interface AssignAWBResponse {
  awb: string;
  courierName?: string;
  trackingUrl?: string;
}

export interface ShippingProviderAdapter {
  get providerType(): ShippingProvider;

  createShipment(request: CreateProviderShipmentRequest): Promise<CreateProviderShipmentResponse>;

  cancelShipment(providerShipmentId: string, providerOrderId?: string | null): Promise<void>;

  assignAWB(providerShipmentId: string, options?: AssignAWBRequest): Promise<AssignAWBResponse>;

  getTracking(providerShipmentId: string, awb: string | null): Promise<NormalizedTrackingEvent[]>;
}
