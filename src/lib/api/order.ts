import { apiClient } from './client';
import { PaginatedOrdersResponse, Order, OrderTrackingResponse } from '@/types/order';

export const orderApi = {
  getOrders: async (page = 1, limit = 20, headers?: HeadersInit): Promise<PaginatedOrdersResponse> => {
    return apiClient.get('/api/me/orders', {
      params: { page, limit },
      headers,
    });
  },

  getOrderById: async (orderId: string, headers?: HeadersInit): Promise<Order> => {
    return apiClient.get(`/api/me/orders/${orderId}`, {
      headers,
    });
  },

  getOrderTracking: async (orderId: string, headers?: HeadersInit): Promise<OrderTrackingResponse> => {
    return apiClient.get(`/api/me/orders/${orderId}/tracking`, {
      headers,
    });
  },

  cancelOrder: async (orderId: string, data: { reason?: string, note?: string }): Promise<void> => {
    return apiClient.post(`/api/me/orders/${orderId}/cancel`, data);
  },

  createReturn: async (orderId: string, data: { items: { orderItemId: string, quantity: number, reason: string }[], customerNote?: string }): Promise<void> => {
    return apiClient.post(`/api/me/orders/${orderId}/returns`, data);
  },

  createExchange: async (orderId: string, data: { items: { orderItemId: string, quantity: number, replacementVariantId: string }[], reason?: string }): Promise<void> => {
    return apiClient.post(`/api/me/orders/${orderId}/exchanges`, data);
  }
};
