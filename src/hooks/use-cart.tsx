"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { cartApi } from "@/lib/api/cart";
import { CartResponse } from "@/types/cart";
import { useAuth } from "@/hooks/use-auth";

interface CartContextType {
  cart: CartResponse | null;
  isLoading: boolean;
  error: Error | null;
  refreshCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load cart"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
      setError(err instanceof Error ? err : new Error("Failed to add item"));
      throw err; // Re-throw to let component show toast/error
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await cartApi.updateItemQuantity(cartItemId, quantity);
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update item quantity"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (cartItemId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await cartApi.removeItem(cartItemId);
      await refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to remove item"));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, isLoading, error, refreshCart, addItem, updateItemQuantity, removeItem }}>
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
