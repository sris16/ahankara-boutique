"use client";

import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { CartItemRow } from "./CartItemRow";
import { useToast } from "@/components/ui/toast";

export function CartDrawer() {
  const { isCartOpen, closeCart, cart, isInitialized, updateItemQuantity, removeItem, error, refreshCart } = useCart();
  const { addItem: addToWishlist } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isInitialized) return null;

  const handleUpdateQty = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      await updateItemQuantity(cartItemId, newQty);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err instanceof Error ? err.message : "Failed to update item quantity.",
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
        description: "The creation has been removed from your shopping bag.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err instanceof Error ? err.message : "Failed to remove item.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveToWishlist = async (productId: string, cartItemId: string) => {
    setUpdatingId(cartItemId);
    try {
      await addToWishlist(productId);
      await removeItem(cartItemId);
      toast({
        variant: "success",
        title: "Moved to Wishlist",
        description: "Creation saved to your private collection.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Unable to save item to wishlist.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleViewBag = () => {
    closeCart();
    router.push("/cart");
  };

  const items = cart?.items || [];
  const hasItems = items.length > 0;
  
  const hasIssues = items.some(
    (item) =>
      item.availability.stockStatus !== "IN_STOCK" &&
      item.availability.stockStatus !== "LOW_STOCK"
  );

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        id="cart-drawer"
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-surface border-l border-border/80"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-6 border-b border-border/60">
          <div className="flex items-baseline justify-between pr-8">
            <SheetTitle className="font-serif text-xl tracking-tight uppercase text-foreground">
              Shopping Bag
            </SheetTitle>
            {cart && hasItems && (
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                ({cart.itemCount} {cart.itemCount === 1 ? "piece" : "pieces"})
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {error && !hasItems ? (
            <div className="h-full flex items-center justify-center py-12">
              <ErrorState
                title="Bag Unavailable"
                message="We couldn't load your shopping bag at this time. Please try again."
                onRetry={refreshCart}
              />
            </div>
          ) : !hasItems ? (
            <div className="h-full flex items-center justify-center py-12">
              <EmptyState
                icon={ShoppingBag}
                title="Your bag is empty"
                description="Discover our newest atelier collections and elevate your seasonal wardrobe."
                action={{
                  label: "Explore Creations",
                  onClick: () => {
                    closeCart();
                    router.push("/products");
                  },
                }}
                className="border-none bg-transparent p-0 my-0 max-w-xs"
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <CartItemRow
                  key={item.cartItemId}
                  item={item}
                  compact={true}
                  isUpdating={updatingId === item.cartItemId}
                  onUpdateQuantity={handleUpdateQty}
                  onRemove={handleRemove}
                  onSaveToWishlist={handleSaveToWishlist}
                  onItemClick={closeCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer with Subtotal & Actions */}
        {cart && hasItems && (
          <div className="p-6 pb-[max(1.5rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] border-t border-border/60 bg-surface-muted/30">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Estimated Subtotal
              </span>
              <span className="font-mono text-xl font-medium tracking-tight text-foreground">
                {formatPrice(cart.subtotal)}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground tracking-wide mb-5">
              Complimentary insured shipping applied. Taxes calculated at checkout.
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={handleCheckout}
                disabled={hasIssues || updatingId !== null}
                className="w-full h-12 uppercase tracking-[0.25em] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={handleViewBag}
                className="w-full h-11 uppercase tracking-[0.2em] text-xs font-medium border-border/80 hover:bg-surface-muted rounded-xs cursor-pointer"
              >
                View Full Bag
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
