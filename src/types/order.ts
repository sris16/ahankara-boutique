export type FulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'DELIVERED' | 'RETURNED' | 'CANCELED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED' | 'PAYMENT_REVIEW';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type ShipmentStatus = 'PENDING' | 'SHIPMENT_CREATED' | 'READY_TO_SHIP' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_ATTEMPTED' | 'DELIVERY_FAILED' | 'RTO_INITIATED' | 'RTO_IN_TRANSIT' | 'RTO_DELIVERED' | 'CANCELLED';

export type CancellationInitiator = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
export type CancellationStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'SIZE_ISSUE' | 'NOT_AS_DESCRIBED' | 'CHANGED_MIND' | 'OTHER';
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'INSPECTED' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED_AFTER_INSPECTION' | 'REFUND_PENDING' | 'REFUNDED' | 'COMPLETED' | 'CANCELLED';

export type ExchangeStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  unitPrice: number;
  compareAtPrice?: number | null;
  quantity: number;
  lineTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string | null;
}

export interface OrderCancellation {
  id: string;
  orderId: string;
  requestedByUserId?: string | null;
  initiator: CancellationInitiator;
  reason?: string | null;
  note?: string | null;
  status: CancellationStatus;
  adminNote?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: string;
  returnRequestId: string;
  orderItemId: string;
  quantity: number;
  reason: ReturnReason;
  approvedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  condition?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  reason: ReturnReason;
  customerNote?: string | null;
  adminNote?: string | null;
  approvedAt?: string | null;
  inspectedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ReturnItem[];
}

export interface ExchangeItem {
  id: string;
  exchangeRequestId: string;
  orderItemId: string;
  quantity: number;
  replacementVariantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRequest {
  id: string;
  orderId: string;
  userId: string;
  status: ExchangeStatus;
  reason?: string | null;
  adminNote?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ExchangeItem[];
}

export interface Refund {
  id: string;
  orderId: string;
  returnRequestId?: string | null;
  paymentId?: string | null;
  providerRefundId?: string | null;
  amount: number;
  reason?: string | null;
  status: RefundStatus;
  failureReason?: string | null;
  idempotencyKey?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  idempotencyKey: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  couponCode?: string | null;
  couponType?: string | null;
  couponValue?: number | null;
  shippingAddressId: string;
  billingAddressId: string;
  reservationExpiresAt?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;

  items?: OrderItem[];
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;

  cancellation?: OrderCancellation | null;
  returnRequests?: ReturnRequest[];
  exchangeRequests?: ExchangeRequest[];
  refunds?: Refund[];
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TrackingEvent {
  status: ShipmentStatus;
  message: string;
  location?: string | null;
  eventTime: string;
}

export interface ShipmentItem {
  productName: string;
  sku: string;
  quantity: number;
}

export interface ShipmentTracking {
  id: string;
  status: ShipmentStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: ShipmentItem[];
  trackingHistory: TrackingEvent[];
}

export interface OrderTrackingResponse {
  orderNumber: string;
  fulfillmentStatus: FulfillmentStatus;
  shipments: ShipmentTracking[];
}
