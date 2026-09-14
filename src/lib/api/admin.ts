/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import type { 
  AdminProduct, AdminProductListResponse, AdminVariant, 
  AdminProductImage, AdminCategory, AdminCategoryTree, AdminCollection,
  LowStockVariant, AdminInventoryTransaction, InventoryAdjustmentRequest,
  InventoryThresholdUpdateRequest, AdminInventory,
  AdminOrder, AdminOrderListResponse, AdminShipment,
  AdminCoupon, AdminCouponDetail, CreateCouponInput, UpdateCouponInput
} from "@/types/admin";

async function rawFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000" : "";
  const url = `${baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include"
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `API error ${response.status}`);
  }
  return data;
}

export const adminApi = {
  // ORDERS
  getOrders: async (page = 1, limit = 20, headers?: HeadersInit): Promise<AdminOrderListResponse> => {
    return apiClient.get(`/api/admin/orders?page=${page}&limit=${limit}`, { headers });
  },
  getOrderById: async (orderId: string, headers?: HeadersInit): Promise<AdminOrder> => {
    return apiClient.get(`/api/admin/orders/${orderId}`, { headers });
  },
  getOrderShipments: async (orderId: string, headers?: HeadersInit): Promise<AdminShipment[]> => {
    return rawFetch(`/api/admin/orders/${orderId}/shipments`, { headers });
  },
  createShipment: async (orderId: string, data: { provider: string, items: { orderItemId: string, quantity: number }[] }): Promise<AdminShipment> => {
    return rawFetch(`/api/admin/orders/${orderId}/shipments`, { method: "POST", body: JSON.stringify(data) });
  },
  cancelShipment: async (shipmentId: string): Promise<AdminShipment> => {
    return rawFetch(`/api/admin/shipments/${shipmentId}/cancel`, { method: "POST" });
  },
  assignAWB: async (shipmentId: string): Promise<AdminShipment> => {
    return rawFetch(`/api/admin/shipments/${shipmentId}/awb`, { method: "POST" });
  },
  
  // DASHBOARD
  getRecentOrders: async (limit = 5, headers?: HeadersInit) => {
    return apiClient.get(`/api/admin/orders?limit=${limit}`, { headers });
  },
  
  getLowStockAlerts: async (headers?: HeadersInit): Promise<LowStockVariant[]> => {
    return apiClient.get('/api/admin/inventory/low-stock', { headers });
  },

  // INVENTORY
  getInventoryTransactions: async (productId: string, variantId: string, page = 1, limit = 20, headers?: HeadersInit): Promise<{ data: AdminInventoryTransaction[], meta: any }> => {
    return apiClient.get(`/api/admin/products/${productId}/variants/${variantId}/inventory/transactions?page=${page}&limit=${limit}`, { headers });
  },
  updateLowStockThreshold: async (productId: string, variantId: string, data: InventoryThresholdUpdateRequest): Promise<AdminInventory> => {
    return apiClient.patch(`/api/admin/products/${productId}/variants/${variantId}/inventory/threshold`, data);
  },
  adjustInventory: async (productId: string, variantId: string, data: InventoryAdjustmentRequest): Promise<AdminInventory> => {
    return apiClient.post(`/api/admin/products/${productId}/variants/${variantId}/inventory/adjust`, data);
  },

  // PRODUCTS
  getProducts: async (params?: Record<string, any>, headers?: HeadersInit): Promise<AdminProductListResponse> => {
    return apiClient.get('/api/admin/products', { params, headers });
  },
  getProductById: async (productId: string, headers?: HeadersInit): Promise<AdminProduct> => {
    return apiClient.get(`/api/admin/products/${productId}`, { headers });
  },
  createProduct: async (data: any): Promise<AdminProduct> => {
    return apiClient.post('/api/admin/products', data);
  },
  updateProduct: async (productId: string, data: any): Promise<AdminProduct> => {
    return apiClient.patch(`/api/admin/products/${productId}`, data);
  },
  publishProduct: async (productId: string): Promise<AdminProduct> => {
    return apiClient.patch(`/api/admin/products/${productId}/publish`);
  },
  archiveProduct: async (productId: string): Promise<AdminProduct> => {
    return apiClient.patch(`/api/admin/products/${productId}/archive`);
  },

  // VARIANTS
  getVariants: async (productId: string, headers?: HeadersInit): Promise<AdminVariant[]> => {
    return apiClient.get(`/api/admin/products/${productId}/variants`, { headers });
  },
  getVariantById: async (productId: string, variantId: string, headers?: HeadersInit): Promise<AdminVariant> => {
    return apiClient.get(`/api/admin/products/${productId}/variants/${variantId}`, { headers });
  },
  createVariant: async (productId: string, data: any): Promise<AdminVariant> => {
    return apiClient.post(`/api/admin/products/${productId}/variants`, data);
  },
  updateVariant: async (productId: string, variantId: string, data: any): Promise<AdminVariant> => {
    return apiClient.patch(`/api/admin/products/${productId}/variants/${variantId}`, data);
  },
  deleteVariant: async (productId: string, variantId: string): Promise<void> => {
    return apiClient.delete(`/api/admin/products/${productId}/variants/${variantId}`);
  },

  // IMAGES
  getImages: async (productId: string, headers?: HeadersInit): Promise<AdminProductImage[]> => {
    return apiClient.get(`/api/admin/products/${productId}/images`, { headers });
  },
  uploadImage: async (productId: string, file: File): Promise<AdminProductImage> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/api/admin/products/${productId}/images`, formData);
  },
  deleteImage: async (productId: string, imageId: string): Promise<void> => {
    return apiClient.delete(`/api/admin/products/${productId}/images/${imageId}`);
  },
  setPrimaryImage: async (productId: string, imageId: string): Promise<AdminProductImage> => {
    return apiClient.patch(`/api/admin/products/${productId}/images/${imageId}/primary`);
  },
  reorderImages: async (productId: string, orderedImageIds: string[]): Promise<void> => {
    return apiClient.patch(`/api/admin/products/${productId}/images/reorder`, { orderedImageIds });
  },

  // CATEGORIES
  getCategories: async (headers?: HeadersInit): Promise<AdminCategory[]> => {
    return apiClient.get('/api/admin/categories', { headers });
  },
  getCategoryTree: async (headers?: HeadersInit): Promise<AdminCategoryTree[]> => {
    return apiClient.get('/api/admin/categories?tree=true', { headers });
  },
  getCategoryById: async (categoryId: string, headers?: HeadersInit): Promise<AdminCategory> => {
    return apiClient.get(`/api/admin/categories/${categoryId}`, { headers });
  },
  createCategory: async (data: any): Promise<AdminCategory> => {
    return apiClient.post('/api/admin/categories', data);
  },
  updateCategory: async (categoryId: string, data: any): Promise<AdminCategory> => {
    return apiClient.patch(`/api/admin/categories/${categoryId}`, data);
  },
  deleteCategory: async (categoryId: string): Promise<void> => {
    return apiClient.delete(`/api/admin/categories/${categoryId}`);
  },

  // COLLECTIONS
  getCollections: async (headers?: HeadersInit): Promise<AdminCollection[]> => {
    return apiClient.get('/api/admin/collections', { headers });
  },
  getCollectionById: async (collectionId: string, headers?: HeadersInit): Promise<AdminCollection> => {
    return apiClient.get(`/api/admin/collections/${collectionId}`, { headers });
  },
  createCollection: async (data: any): Promise<AdminCollection> => {
    return apiClient.post('/api/admin/collections', data);
  },
  updateCollection: async (collectionId: string, data: any): Promise<AdminCollection> => {
    return apiClient.patch(`/api/admin/collections/${collectionId}`, data);
  },
  deleteCollection: async (collectionId: string): Promise<void> => {
    return apiClient.delete(`/api/admin/collections/${collectionId}`);
  },

  // COUPONS
  getCoupons: async (headers?: HeadersInit): Promise<AdminCoupon[]> => {
    return rawFetch('/api/admin/coupons', { headers });
  },
  getCouponById: async (couponId: string, headers?: HeadersInit): Promise<AdminCouponDetail> => {
    return rawFetch(`/api/admin/coupons/${couponId}`, { headers });
  },
  createCoupon: async (data: CreateCouponInput): Promise<AdminCouponDetail> => {
    return rawFetch('/api/admin/coupons', { method: 'POST', body: JSON.stringify(data) });
  },
  updateCoupon: async (couponId: string, data: UpdateCouponInput): Promise<AdminCouponDetail> => {
    return rawFetch(`/api/admin/coupons/${couponId}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  deleteCoupon: async (couponId: string): Promise<{ message?: string }> => {
    return rawFetch(`/api/admin/coupons/${couponId}`, { method: 'DELETE' });
  }
};
