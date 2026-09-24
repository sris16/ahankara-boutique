"use client";

import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function WishlistRemoveButton({ wishlistItemId, productName }: { wishlistItemId: string; productName: string }) {
  const { removeItem } = useWishlist();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    try {
      await removeItem(wishlistItemId);
      // Let the optimistic UI take over, Next.js might need a refresh to sync server component if we want,
      // but the optimistic useWishlist will just remove it globally.
      // To sync the server page, we call router.refresh()
      // Wait, if it's optimistic, the item is removed from context, but the server-rendered DOM still has it until router.refresh().
      // This is a common issue with mixing server-rendering and client-mutations.
      // We will hide it locally if removing.
    } catch (err) {
      console.error(err);
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center shadow-sm z-10">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      onClick={handleRemove}
      className="absolute top-2 right-2 z-10 w-8 h-8 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-sm"
      aria-label={`Remove ${productName} from wishlist`}
    >
      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
    </button>
  );
}

export function WishlistMoveToCartButton({
  wishlistItemId,
  slug,
  hasAvailableStock
}: {
  wishlistItemId: string;
  slug: string;
  hasAvailableStock: boolean;
}) {
  const { moveToCart } = useWishlist();
  const { openCart } = useCart();
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);

  const handleMoveToCart = async () => {
    setIsActing(true);
    try {
      await moveToCart(wishlistItemId, undefined, 1);
      openCart();
      // Success!
    } catch (err) {
      if (err instanceof Error && err.message?.includes('Variant ID is required')) {
        // Product has multiple variants. Direct to PDP to select size/color.
        router.push(`/products/${slug}`);
      } else {
        alert(err instanceof Error ? err.message : "Failed to move to cart");
        setIsActing(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full mt-4 uppercase tracking-widest text-xs h-10"
      disabled={!hasAvailableStock || isActing}
      onClick={handleMoveToCart}
    >
      {isActing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : !hasAvailableStock ? (
        "Unavailable"
      ) : (
        <>
          <ShoppingBag className="w-4 h-4 mr-2" /> Move to Bag
        </>
      )}
    </Button>
  );
}
