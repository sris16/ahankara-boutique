"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/utils";
import { Heart, Sparkles, Loader2 } from "lucide-react";
import { WishlistItemResponse } from "@/types/wishlist";
import { WishlistRemoveButton, WishlistMoveToCartButton } from "./wishlist-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";

export function WishlistClient({
  initialWishlist,
}: {
  initialWishlist: WishlistItemResponse[];
}) {
  const { wishlist: contextWishlist, isInitialized, error, refreshWishlist } = useWishlist();

  // Use server-rendered data initially, then client context takes over
  const displayList = isInitialized ? contextWishlist : initialWishlist;

  if (!isInitialized && initialWishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
          Loading Curated Collection...
        </span>
      </div>
    );
  }

  if (error && displayList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <ErrorState
          title="Wishlist Unavailable"
          message="We couldn't load your saved pieces at this time. Please try again."
          onRetry={refreshWishlist}
        />
      </div>
    );
  }

  if (displayList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save your favorite handcrafted creations to review, compare, or acquire later."
          action={{
            label: "Explore Collection",
            href: "/products",
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 min-h-[60vh]">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium block mb-2">
            Curated Wardrobe
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground">
            Saved Pieces
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>
            {displayList.length} {displayList.length === 1 ? "Piece Saved" : "Pieces Saved"}
          </span>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {displayList.map((item) => (
          <div key={item.id} className="flex flex-col group relative">
            {/* Image Card */}
            <div className="relative aspect-[3/4] bg-surface-muted overflow-hidden rounded-xs border border-border/40 mb-3.5">
              <Link href={`/products/${item.slug}`} className="block w-full h-full">
                {item.primaryImage ? (
                  <Image
                    src={item.primaryImage}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-surface-muted to-brand-50/40 select-none">
                    <span className="font-serif text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 font-medium text-center">
                      AHANKARA
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
                      Atelier Piece
                    </span>
                  </div>
                )}
              </Link>

              {/* Status Badges */}
              {!item.hasAvailableStock && (
                <div className="absolute top-2.5 left-2.5 z-10">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-background/90 backdrop-blur-sm shadow-xs">
                    Sold Out
                  </Badge>
                </div>
              )}

              {/* Quick Remove Button */}
              <WishlistRemoveButton wishlistItemId={item.id} productName={item.name} />
            </div>

            {/* Product Meta */}
            <div className="flex flex-col flex-1 justify-between">
              <div>
                <h2 className="font-serif text-sm tracking-wide leading-snug group-hover:text-accent transition-colors">
                  <Link href={`/products/${item.slug}`} className="line-clamp-1">
                    {item.name}
                  </Link>
                </h2>
                <div className="flex items-baseline gap-2 mt-1 text-sm">
                  <span className="font-mono font-medium text-foreground tracking-tight">
                    {formatPrice(item.effectiveStartingPrice)}
                  </span>
                </div>
              </div>

              {/* Move to Bag Action */}
              <WishlistMoveToCartButton
                wishlistItemId={item.id}
                slug={item.slug}
                hasAvailableStock={item.hasAvailableStock}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
