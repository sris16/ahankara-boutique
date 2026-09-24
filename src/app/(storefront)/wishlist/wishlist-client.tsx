"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/utils";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistItemResponse } from "@/types/wishlist";
import { WishlistRemoveButton, WishlistMoveToCartButton } from "./wishlist-controls";

export function WishlistClient({ initialWishlist }: { initialWishlist: WishlistItemResponse[] }) {
  const { wishlist: contextWishlist, isInitialized } = useWishlist();

  // Use server-rendered data initially. Once client context loads, it takes over.
  // This allows optimistic updates to reflect instantly, and avoids initial loading spinners.
  const displayList = isInitialized ? contextWishlist : initialWishlist;

  if (displayList.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <Heart className="w-12 h-12 text-muted-foreground mb-6 stroke-[1.5]" />
        <h1 className="font-serif text-3xl md:text-4xl mb-4 tracking-tight uppercase">Your Wishlist</h1>
        <p className="text-muted-foreground mb-8 text-sm uppercase tracking-widest">Pieces you love will appear here.</p>
        <Button asChild size="lg" className="rounded-none uppercase tracking-widest text-xs px-8 h-12">
          <Link href="/products">Explore the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 min-h-[60vh]">
      <div className="mb-12 text-center">
        <h1 className="font-serif text-3xl md:text-4xl mb-3 tracking-tight uppercase">Wishlist</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Your saved pieces</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-x-8 md:gap-y-12">
        {displayList.map((item) => (
          <div key={item.id} className="flex flex-col group relative">
            <Link href={`/products/${item.slug}`} className="relative aspect-[3/4] bg-muted/10 overflow-hidden rounded-sm mb-4">
              {item.primaryImage ? (
                <Image
                  src={item.primaryImage}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest">No Image</div>
              )}

              <WishlistRemoveButton wishlistItemId={item.id} productName={item.name} />

              {!item.hasAvailableStock && (
                <div className="absolute top-2 left-2 bg-background/90 text-foreground text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-sm">
                  Out of Stock
                </div>
              )}
            </Link>

            <div className="flex flex-col gap-1">
              <h3 className="font-serif text-sm tracking-wide leading-tight group-hover:text-muted-foreground transition-colors">
                <Link href={`/products/${item.slug}`}>
                  {item.name}
                </Link>
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm font-medium">
                {formatPrice(item.effectiveStartingPrice)}
              </div>
            </div>

            <WishlistMoveToCartButton
              wishlistItemId={item.id}
              slug={item.slug}
              hasAvailableStock={item.hasAvailableStock}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
