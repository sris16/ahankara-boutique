import { CartResponse } from './cart';

export interface CouponValidationResponse {
  subtotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  estimatedDeliveryAt?: string | null;
  coupon: {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    description: string | null;
  } | null;
}

export interface CheckoutRequest {
  shippingAddressId: string;
  billingAddressId?: string;
  couponCode?: string;
}

export interface PaymentAttemptResponse {
  id: string;
  providerOrderId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressSnapshot {
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

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  couponCode: string | null;
  couponType: string | null;
  couponValue: number | null;
  reservationExpiresAt: string | null;
  shippingAddressId: string;
  billingAddressId: string;
  items: OrderItemSnapshot[];
  shippingAddress: OrderAddressSnapshot;
  billingAddress: OrderAddressSnapshot;
  createdAt: string;
  updatedAt: string;
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
