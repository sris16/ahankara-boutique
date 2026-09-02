import { apiClient } from "./client";
import { CartResponse } from "@/types/cart";

export const cartApi = {
  getCart: () => apiClient.get<CartResponse>("/api/me/cart"),
  
  addItem: (variantId: string, quantity: number) => 
    apiClient.post<CartResponse>("/api/me/cart/items", { variantId, quantity }),
    
  updateItemQuantity: (cartItemId: string, quantity: number) =>
    apiClient.patch<CartResponse>(`/api/me/cart/items/${cartItemId}`, { quantity }),
    
  removeItem: (cartItemId: string) =>
    apiClient.delete<{ success: boolean }>(`/api/me/cart/items/${cartItemId}`),
    
  clearCart: () =>
    apiClient.delete<{ success: boolean }>("/api/me/cart/items"),
};
