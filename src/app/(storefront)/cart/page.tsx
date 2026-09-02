"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { Loader2, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { cart, isLoading, updateItemQuantity, removeItem } = useCart();
  const { user, loading } = useAuth();
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateQty = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      await updateItemQuantity(cartItemId, newQty);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setUpdatingId(cartItemId);
    try {
      await removeItem(cartItemId);
    } catch (err) {
      alert("Failed to remove item");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || (isLoading && !cart)) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mb-6" />
        <h1 className="font-serif text-3xl mb-4">Your Shopping Bag</h1>
        <p className="text-muted-foreground mb-8">Please sign in to view your bag.</p>
        <Button asChild size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mb-6" />
        <h1 className="font-serif text-3xl mb-4">Your bag is waiting.</h1>
        <p className="text-muted-foreground mb-8">Discover our latest pieces and elevate your wardrobe.</p>
        <Button asChild size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="font-serif text-3xl md:text-4xl mb-12">Shopping Bag</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="flex-1">
          <div className="hidden md:grid grid-cols-12 text-xs font-medium uppercase tracking-widest text-muted-foreground pb-4 border-b">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-3 text-right">Total</div>
          </div>

          <div className="flex flex-col gap-6 pt-6">
            {cart.items.map((item) => {
              const isUpdating = updatingId === item.cartItemId;
              const hasIssue = item.availability.stockStatus !== 'IN_STOCK' && item.availability.stockStatus !== 'LOW_STOCK';

              return (
                <div key={item.cartItemId} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center py-4 border-b">
                  {/* Product Info */}
                  <div className="col-span-6 flex gap-4 w-full">
                    <Link href={`/products/${item.product.slug}`} className="shrink-0">
                      <div className="relative w-24 aspect-[3/4] bg-muted/10 overflow-hidden rounded-sm">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">NO IMAGE</div>
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col gap-1 justify-center">
                      <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                        {item.product.name}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1 flex flex-col gap-0.5">
                        {item.variant.color && <span>Color: {item.variant.color}</span>}
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                      </div>
                      
                      {item.availability.stockStatus === 'INSUFFICIENT_STOCK' && (
                        <p className="text-xs font-medium text-destructive mt-2">Not enough stock for {item.quantity}</p>
                      )}
                      {item.availability.stockStatus === 'PRODUCT_UNAVAILABLE' && (
                        <p className="text-xs font-medium text-destructive mt-2">Product is no longer available</p>
                      )}
                      {item.availability.stockStatus === 'OUT_OF_STOCK' && (
                        <p className="text-xs font-medium text-destructive mt-2">Currently out of stock</p>
                      )}
                      
                      <button 
                        onClick={() => handleRemove(item.cartItemId)}
                        disabled={isUpdating}
                        className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 mt-4 text-left self-start"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Mobile Price/Quantity Row */}
                  <div className="md:hidden flex items-center justify-between w-full mt-4">
                    <div className="text-sm">{formatPrice(item.pricing.lineTotal)}</div>
                    <div className="flex items-center border rounded-sm overflow-hidden h-9">
                      <button 
                        onClick={() => handleUpdateQty(item.cartItemId, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-9 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.cartItemId, item.quantity + 1)}
                        disabled={isUpdating || hasIssue}
                        className="w-9 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Quantity */}
                  <div className="col-span-3 hidden md:flex justify-center">
                    <div className="flex items-center border rounded-sm overflow-hidden h-10 opacity-100 transition-opacity" style={{ opacity: isUpdating ? 0.5 : 1 }}>
                      <button 
                        onClick={() => handleUpdateQty(item.cartItemId, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.cartItemId, item.quantity + 1)}
                        disabled={isUpdating || hasIssue}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Total */}
                  <div className="col-span-3 hidden md:block text-right">
                    <div className="flex flex-col gap-1 items-end">
                      <span className="font-medium text-lg">{formatPrice(item.pricing.lineTotal)}</span>
                      {item.pricing.compareAtPrice !== null && item.pricing.compareAtPrice > item.pricing.unitPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.pricing.compareAtPrice * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-muted/10 rounded-sm p-6 lg:sticky lg:top-24 border">
            <h2 className="font-serif text-xl mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 text-sm mb-6 border-b pb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="font-medium text-lg tracking-tight">Total</span>
              <span className="font-medium text-2xl tracking-tight">{formatPrice(cart.subtotal)}</span>
            </div>

            <Button className="w-full uppercase tracking-widest" size="lg" asChild>
              <Link href="/checkout">Checkout</Link>
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Taxes and shipping are calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
