"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/utils";
import { Loader2, Heart, Trash2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { wishlist, isLoading, removeItem, moveToCart } = useWishlist();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [actingId, setActingId] = useState<string | null>(null);

  const handleRemove = async (wishlistItemId: string) => {
    setActingId(wishlistItemId);
    try {
      await removeItem(wishlistItemId);
    } catch (err) {
      alert("Failed to remove item");
    } finally {
      setActingId(null);
    }
  };

  const handleMoveToCart = async (wishlistItemId: string, slug: string) => {
    setActingId(wishlistItemId);
    try {
      await moveToCart(wishlistItemId, undefined, 1);
      // Success! Moved to cart.
    } catch (err) {
      if (err instanceof Error && err.message?.includes('Variant ID is required')) {
        // Product has multiple variants. Direct to PDP to select size/color.
        router.push(`/products/${slug}`);
      } else {
        alert(err instanceof Error ? err.message : "Failed to move to cart");
      }
    } finally {
      setActingId(null);
    }
  };

  if (loading || (isLoading && wishlist.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <Heart className="w-12 h-12 text-muted-foreground mb-6" />
        <h1 className="font-serif text-3xl mb-4">Your Wishlist</h1>
        <p className="text-muted-foreground mb-8">Please sign in to view your saved pieces.</p>
        <Button asChild size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <Heart className="w-12 h-12 text-muted-foreground mb-6" />
        <h1 className="font-serif text-3xl mb-4">Your wishlist is empty.</h1>
        <p className="text-muted-foreground mb-8">Save your favorite pieces here.</p>
        <Button asChild size="lg">
          <Link href="/products">Discover Pieces</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="font-serif text-3xl md:text-4xl mb-12">Wishlist</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {wishlist.map((item) => {
          const isActing = actingId === item.id;

          return (
            <div key={item.id} className="flex flex-col group relative">
              <Link href={`/products/${item.slug}`} className="relative aspect-[3/4] bg-muted/10 overflow-hidden rounded-sm mb-4">
                {item.primaryImage ? (
                  <Image
                    src={item.primaryImage}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">NO IMAGE</div>
                )}
                
                {/* Remove button overlays on image */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(item.id);
                  }}
                  disabled={isActing}
                  className="absolute top-2 right-2 w-8 h-8 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
                
                {/* Stock Badge */}
                {!item.hasAvailableStock && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                    Out of Stock
                  </div>
                )}
              </Link>
              
              <div className="flex flex-col gap-1">
                <Link href={`/products/${item.slug}`} className="font-medium hover:underline line-clamp-1">
                  {item.name}
                </Link>
                <div className="text-sm font-medium">
                  {formatPrice(item.effectiveStartingPrice)}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 uppercase tracking-widest text-xs h-10"
                disabled={!item.hasAvailableStock || isActing}
                onClick={() => handleMoveToCart(item.id, item.slug)}
              >
                {isActing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !item.hasAvailableStock ? (
                  "Unavailable"
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Move to Bag
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
