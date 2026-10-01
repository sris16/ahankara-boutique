"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/utils";
import { CartResponse } from "@/types/cart";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ShoppingBag, ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartClientProps {
  initialCart: CartResponse | null;
}

export function CartClient({ initialCart }: CartClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { cart: contextCart, isInitialized, updateItemQuantity, removeItem } = useCart();
  const { addItem: addToWishlist } = useWishlist();
  const { toast } = useToast();

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Authoritative cart: context takes over once initialized; otherwise server initialCart
  const cart = contextCart || initialCart;

  const handleUpdateQty = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      await updateItemQuantity(cartItemId, newQty);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Unable to adjust quantity.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setUpdatingId(cartItemId);
    try {
      await removeItem(cartItemId);
      toast({
        variant: "default",
        title: "Piece Removed",
        description: "Creation removed from your shopping bag.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err instanceof Error ? err.message : "Unable to remove item.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveToWishlist = async (productId: string, cartItemId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setUpdatingId(cartItemId);
    try {
      await addToWishlist(productId);
      await removeItem(cartItemId);
      toast({
        variant: "success",
        title: "Saved to Wishlist",
        description: "Creation moved to your private collection.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Unable to save item to wishlist.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  // Loading state
  if (!isInitialized && !initialCart) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
          Loading Atelier Bag...
        </span>
      </div>
    );
  }

  // Unauthenticated state
  if (!user && !cart?.items.length) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your bag"
          description="Access your saved selections, sync across devices, and experience bespoke checkout."
          action={{
            label: "Sign In",
            href: "/login",
          }}
          secondaryAction={{
            label: "Explore Creations",
            href: "/products",
          }}
        />
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping bag is empty"
          description="Explore our latest runway collections and handcrafted pieces."
          action={{
            label: "Explore Collection",
            href: "/products",
          }}
        />
      </div>
    );
  }

  const items = cart.items;
  const hasIssues = items.some(
    (item) =>
      item.availability.stockStatus !== "IN_STOCK" &&
      item.availability.stockStatus !== "LOW_STOCK"
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 pb-28 lg:pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium block mb-2">
            Atelier Checkout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground">
            Shopping Bag
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>
            {cart.itemCount} {cart.itemCount === 1 ? "Curated Piece" : "Curated Pieces"}
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          {/* Table Header (Desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground pb-4 border-b border-border/60">
            <div className="sm:col-span-8">Piece Details</div>
            <div className="sm:col-span-4 text-right">Investment</div>
          </div>

          {/* Line Items */}
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                compact={false}
                isUpdating={updatingId === item.cartItemId}
                onUpdateQuantity={handleUpdateQty}
                onRemove={handleRemove}
                onSaveToWishlist={handleSaveToWishlist}
              />
            ))}
          </div>

          {/* Bottom Navigation Link */}
          <div className="pt-8 mt-2 flex items-center justify-between border-t border-border/40">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Exploring</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
          <CartSummary
            subtotal={cart.subtotal}
            itemCount={cart.itemCount}
            onCheckout={handleCheckout}
            disabled={hasIssues || updatingId !== null}
          />
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/80 px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-elevated lg:hidden">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Subtotal ({cart.itemCount})
            </span>
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              {formatPrice(cart.subtotal)}
            </span>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={hasIssues || updatingId !== null}
            className="flex-1 h-12 uppercase tracking-[0.2em] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
          >
            <span>Checkout</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
