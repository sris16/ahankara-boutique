import { apiClient } from "./client";

export const adminApi = {
  getRecentOrders: async (limit = 5, headers?: HeadersInit) => {
    return apiClient.get(`/api/admin/orders?limit=${limit}`, { headers });
  },

  getLowStockAlerts: async (headers?: HeadersInit) => {
    return apiClient.get('/api/admin/inventory/low-stock', { headers });
  }
};
