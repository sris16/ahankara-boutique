"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { wishlistApi } from "@/lib/api/wishlist";
import { WishlistItemResponse } from "@/types/wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";

interface WishlistContextType {
  wishlist: WishlistItemResponse[];
  isLoading: boolean;
  error: Error | null;
  refreshWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (wishlistItemId: string) => Promise<void>;
  moveToCart: (wishlistItemId: string, variantId: string | undefined, quantity: number) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  getWishlistItemId: (productId: string) => string | undefined;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { refreshCart } = useCart(); // to sync cart after move-to-cart
  const [wishlist, setWishlist] = useState<WishlistItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load wishlist"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshWishlist();
    }
  }, [loading, refreshWishlist]);

  const addItem = async (productId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await wishlistApi.addItem(productId);
      await refreshWishlist();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to add to wishlist"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (wishlistItemId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await wishlistApi.removeItem(wishlistItemId);
      await refreshWishlist();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove from wishlist"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const moveToCart = async (wishlistItemId: string, variantId: string | undefined, quantity: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await wishlistApi.moveToCart(wishlistItemId, variantId, quantity);
      await refreshWishlist();
      await refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to move to cart"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isWishlisted = useCallback((productId: string) => {
    return wishlist.some(item => item.productId === productId);
  }, [wishlist]);

  const getWishlistItemId = useCallback((productId: string) => {
    return wishlist.find(item => item.productId === productId)?.id;
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ 
      wishlist, isLoading, error, refreshWishlist, addItem, removeItem, moveToCart, isWishlisted, getWishlistItemId 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
