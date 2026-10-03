"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { cartApi } from "@/lib/api/cart";
import { CartResponse } from "@/types/cart";
import { useAuth } from "@/hooks/use-auth";

interface CartContextType {
  cart: CartResponse | null;
  isLoading: boolean;
  isInitialized: boolean;
  isCartOpen: boolean;
  error: Error | null;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: (silent?: boolean) => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshCart = useCallback(async (silent = false) => {
    if (!user) {
      setCart(null);
      setIsInitialized(true);
      return;
    }

    if (!silent) setIsLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load cart"));
    } finally {
      if (!silent) setIsLoading(false);
      setIsInitialized(true);
    }
  }, [user]);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
    refreshCart(true); // Silently sync authoritative cart when opened
  }, [refreshCart]);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshCart();
    }
  }, [loading, refreshCart]);

  const addItem = async (variantId: string, quantity: number) => {
    if (!user) return; // Normally trigger login here or let component handle it

    setIsLoading(true);
    try {
      const data = await cartApi.addItem(variantId, quantity);
      setCart(data);
      setError(null);
    } catch (err) {
      // Re-fetch authoritative state on rejection
      await refreshCart(true);
      throw err; // Let component show toast
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;

    // Optimistic UI update
    const prevCart = cart;
    if (cart) {
      const existingItem = cart.items.find(i => i.cartItemId === cartItemId);
      if (existingItem) {
        const diff = quantity - existingItem.quantity;
        setCart({
          ...cart,
          itemCount: cart.itemCount + diff,
          items: cart.items.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i)
        });
      }
    }

    setIsLoading(true);
    try {
      const data = await cartApi.updateItemQuantity(cartItemId, quantity);
      setCart(data);
      setError(null);
    } catch (err) {
      // Revert on failure, but fetch authoritative state
      setCart(prevCart);
      await refreshCart(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!user) return;

    // Optimistic update
    const prevCart = cart;
    if (cart) {
      const removedItem = cart.items.find(i => i.cartItemId === cartItemId);
      if (removedItem) {
        setCart({
          ...cart,
          itemCount: cart.itemCount - removedItem.quantity,
          items: cart.items.filter(i => i.cartItemId !== cartItemId)
        });
      }
    }

    setIsLoading(true);
    try {
      await cartApi.removeItem(cartItemId);
      // Fetch authoritative state after removal
      await refreshCart();
    } catch (err) {
      // Revert on failure
      setCart(prevCart);
      await refreshCart(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cart, isLoading, isInitialized, isCartOpen, error,
      openCart, closeCart, refreshCart, addItem, updateItemQuantity, removeItem
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
