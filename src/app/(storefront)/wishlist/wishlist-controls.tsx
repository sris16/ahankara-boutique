"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WishlistRemoveButton({
  wishlistItemId,
  productName,
}: {
  wishlistItemId: string;
  productName: string;
}) {
  const { removeItem } = useWishlist();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    try {
      await removeItem(wishlistItemId);
      toast({
        variant: "default",
        title: "Piece Removed",
        description: `${productName} removed from your private wishlist.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: err instanceof Error ? err.message : "Could not remove item from wishlist.",
      });
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="absolute top-2.5 right-2.5 w-8 h-8 bg-surface/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xs z-10">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-surface/85 backdrop-blur-md hover:bg-surface rounded-full flex items-center justify-center transition-all duration-200 shadow-xs border border-border/40 hover:border-destructive/40 group/btn cursor-pointer"
      aria-label={`Remove ${productName} from wishlist`}
    >
      <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-destructive transition-colors" />
    </button>
  );
}

export function WishlistMoveToCartButton({
  wishlistItemId,
  slug,
  hasAvailableStock,
}: {
  wishlistItemId: string;
  slug: string;
  hasAvailableStock: boolean;
}) {
  const { moveToCart } = useWishlist();
  const { openCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isActing, setIsActing] = useState(false);

  const handleMoveToCart = async () => {
    setIsActing(true);
    try {
      await moveToCart(wishlistItemId, undefined, 1);
      toast({
        variant: "success",
        title: "Added to Shopping Bag",
        description: "Piece transferred from wishlist to your bag.",
      });
      openCart();
    } catch (err) {
      if (err instanceof Error && err.message?.includes("Variant ID is required")) {
        toast({
          variant: "default",
          title: "Select Preferences",
          description: "Please select your preferred size and color.",
        });
        router.push(`/products/${slug}`);
      } else {
        toast({
          variant: "destructive",
          title: "Unable to Move",
          description: err instanceof Error ? err.message : "Failed to move item to bag.",
        });
        setIsActing(false);
      }
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full mt-3 uppercase tracking-[0.2em] text-xs h-11 border-border/80 hover:bg-surface-muted transition-all cursor-pointer rounded-xs"
      disabled={!hasAvailableStock || isActing}
      onClick={handleMoveToCart}
    >
      {isActing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : !hasAvailableStock ? (
        "Unavailable"
      ) : (
        <>
          <ShoppingBag className="w-3.5 h-3.5 mr-2" />
          <span>Move to Bag</span>
        </>
      )}
    </Button>
  );
}
