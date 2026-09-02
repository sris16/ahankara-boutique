import { apiClient } from "./client";
import { WishlistItemResponse } from "@/types/wishlist";

export const wishlistApi = {
  getWishlist: () => 
    apiClient.get<WishlistItemResponse[]>("/api/me/wishlist"),
    
  addItem: (productId: string) => 
    apiClient.post<{ success: boolean; message?: string; wishlistItem?: unknown }>("/api/me/wishlist", { productId }),
    
  removeItem: (wishlistItemId: string) =>
    apiClient.delete<{ success: boolean }>(`/api/me/wishlist/${wishlistItemId}`),
    
  moveToCart: (wishlistItemId: string, variantId: string | undefined, quantity: number) =>
    apiClient.post<{ success: boolean }>(`/api/me/wishlist/${wishlistItemId}/move-to-cart`, { variantId, quantity }),
};
