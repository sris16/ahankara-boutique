"use client";

import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { isCartOpen, closeCart, cart, isInitialized, updateItemQuantity, removeItem } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  if (!isInitialized) return null;

  const handleUpdateQty = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(cartItemId);
    try {
      await updateItemQuantity(cartItemId, newQty);
    } catch {
      // Errors are handled/alerted by context or we can just ignore here since optimistic UI rolls back
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setUpdatingId(cartItemId);
    try {
      await removeItem(cartItemId);
    } catch {
      // Ignored, context handles it
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
        className={`fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] bg-background border-l shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-serif text-xl tracking-tight uppercase">Your Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground stroke-[1.5]" />
              <div>
                <p className="text-lg font-serif mb-2">Your cart is empty.</p>
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Discover our latest pieces.</p>
              </div>
              <Button onClick={() => { closeCart(); router.push('/products'); }} variant="outline" className="uppercase tracking-widest">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {cart.items.map((item) => {
                const isUpdating = updatingId === item.cartItemId;
                const hasIssue = item.availability.stockStatus !== 'IN_STOCK' && item.availability.stockStatus !== 'LOW_STOCK';

                return (
                  <div key={item.cartItemId} className="flex gap-4 group">
                    <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="shrink-0">
                      <div className="relative w-20 aspect-[3/4] bg-muted/10 overflow-hidden rounded-sm">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">NO IMAGE</div>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-col flex-1 justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col">
                          <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="font-medium text-sm hover:underline line-clamp-1">
                            {item.product.name}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.variant.color && <span>{item.variant.color}</span>}
                            {item.variant.size && <span> | {item.variant.size}</span>}
                          </div>
                        </div>
                        <div className="text-sm font-medium shrink-0">
                          {formatPrice(item.pricing.lineTotal)}
                        </div>
                      </div>

                      {hasIssue && (
                        <p className="text-[10px] text-destructive uppercase tracking-widest font-medium mt-1">
                          {item.availability.stockStatus.replace(/_/g, ' ')}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-sm h-8" style={{ opacity: isUpdating ? 0.5 : 1 }}>
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                            aria-label={`Decrease quantity for ${item.product.name}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.cartItemId, item.quantity + 1)}
                            disabled={isUpdating || hasIssue}
                            className="w-8 h-full flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                            aria-label={`Increase quantity for ${item.product.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.cartItemId)}
                          disabled={isUpdating}
                          className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t bg-muted/5">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Subtotal</span>
              <span className="text-lg font-medium">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleCheckout} className="w-full uppercase tracking-widest h-12" size="lg">
                Checkout
              </Button>
              <Button variant="outline" onClick={() => { closeCart(); router.push('/cart'); }} className="w-full uppercase tracking-widest h-12">
                View Bag
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-4">
              Shipping & taxes calculated at checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
