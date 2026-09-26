import { apiClient } from './client';
import { 
  CouponValidationResponse, 
  CheckoutRequest, 
  Order, 
  PaymentAttemptResponse, 
  PaymentVerificationRequest 
} from '@/types/checkout';

export const checkoutApi = {
  validateCoupon: async (code: string): Promise<CouponValidationResponse> => {
    // The endpoint returns raw json instead of the standard successResponse wrapper in some cases,
    // so we handle it natively or trust apiClient to return the raw object if it's not standard
    return apiClient.post('/api/me/cart/coupon/validate', { code });
  },

  getCheckoutPricing: async (addressId?: string, couponCode?: string): Promise<CouponValidationResponse> => {
    const params = new URLSearchParams();
    if (addressId) params.append('addressId', addressId);
    if (couponCode) params.append('couponCode', couponCode);
    return apiClient.get(`/api/me/checkout/pricing?${params.toString()}`);
  },

  createOrder: async (data: CheckoutRequest, idempotencyKey: string): Promise<Order> => {
    return apiClient.post('/api/me/checkout', data, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    });
  },

  createPaymentAttempt: async (orderId: string): Promise<PaymentAttemptResponse> => {
    return apiClient.post(`/api/me/orders/${orderId}/payment`, {});
  },

  verifyPayment: async (orderId: string, data: PaymentVerificationRequest): Promise<Order> => {
    return apiClient.post(`/api/me/orders/${orderId}/payment/verify`, data);
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    return apiClient.get(`/api/me/orders/${orderId}`);
  }
};
