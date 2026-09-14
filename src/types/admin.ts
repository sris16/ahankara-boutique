export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  icon: string | null;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryTree extends AdminCategory {
  children: AdminCategoryTree[];
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductImage {
  id: string;
  url: string;
  secureUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVariant {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number | null; // in paise
  compareAtPrice: number | null; // in paise
  weightInGrams: number | null;
  lengthCm: number | null;
  breadthCm: number | null;
  heightCm: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventory?: AdminInventory;
}

export interface AdminInventory {
  id: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTransactionType = 
  | 'RESTOCK'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'SALE'
  | 'RETURN';

export interface AdminInventoryTransaction {
  id: string;
  inventoryId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
}

export interface InventoryAdjustmentRequest {
  delta: number;
  reason?: string;
  reference?: string;
}

export interface InventoryThresholdUpdateRequest {
  lowStockThreshold: number;
}

export interface LowStockVariant extends AdminInventory {
  sku: string;
  size: string | null;
  color: string | null;
  productId: string;
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  basePrice: number; // in paise
  compareAtPrice: number | null; // in paise
  categoryId: string;
  isFeatured: boolean;
  status: ProductStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  category?: AdminCategory;
  collections?: { collection: AdminCollection; sortOrder: number }[];
  images?: AdminProductImage[];
  variants?: AdminVariant[];
}

export interface AdminProductListResponse {
  data: AdminProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'PAYMENT_REVIEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type FulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'DELIVERED';
export type ShipmentStatus = 'PENDING' | 'READY_TO_SHIP' | 'SHIPMENT_CREATED' | 'PICKUP_SCHEDULED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_ATTEMPTED' | 'DELIVERY_FAILED' | 'RTO_INITIATED' | 'RTO_IN_TRANSIT' | 'RTO_DELIVERED' | 'CANCELLED';
export type ShippingProvider = 'MOCK' | 'SHIPROCKET';

export interface AdminOrderAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark: string | null;
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  discountAmount: number;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  signatureVerified: boolean;
  failureCode: string | null;
  failureDescription: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminShipmentItem {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
  createdAt: string;
  orderItem?: AdminOrderItem;
}

export interface AdminShipmentTrackingEvent {
  id: string;
  shipmentId: string;
  providerEventId: string | null;
  status: ShipmentStatus;
  message: string | null;
  location: string | null;
  eventTime: string;
  createdAt: string;
}

export interface AdminShipment {
  id: string;
  orderId: string;
  provider: ShippingProvider;
  providerShipmentId: string | null;
  providerOrderId: string | null;
  awb: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  courierName: string | null;
  trackingUrl: string | null;
  estimatedDeliveryAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: AdminShipmentItem[];
  trackingEvents?: AdminShipmentTrackingEvent[];
  order?: {
    orderNumber: string;
    user: {
      name: string | null;
      email: string;
    }
  };
  _count?: {
    items: number;
  }
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  idempotencyKey: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  couponCode: string | null;
  couponType: string | null; // CouponType is not re-exported, keep it simple string or re-export
  couponValue: number | null;
  reservationExpiresAt: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  createdAt: string;
  updatedAt: string;
  
  items?: AdminOrderItem[];
  shippingAddress?: AdminOrderAddress | null;
  billingAddress?: AdminOrderAddress | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  payments?: AdminPayment[];
  shipments?: AdminShipment[];
}

export interface AdminOrderListResponse {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: CouponType;
  value: number; // paise or percentage
  minimumOrderAmount: number; // paise
  maximumDiscountAmount: number | null; // paise
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    redemptions: number;
  };
}

export interface AdminCouponDetail extends AdminCoupon {
  products: { productId: string }[];
  categories: { categoryId: string }[];
  collections: { collectionId: string }[];
  redemptions: {
    id: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    redeemedAt: string;
  }[];
}

export interface CreateCouponInput {
  code: string;
  name: string;
  description?: string | null;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  productIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
}

export type UpdateCouponInput = Partial<CreateCouponInput>;
