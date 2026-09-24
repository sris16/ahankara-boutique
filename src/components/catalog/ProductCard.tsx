"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductSummary } from "@/types/catalog";
import { formatPrice, cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: ProductSummary;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isWishlisted, addItem, removeItem, getWishlistItemId } = useWishlist();

  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product details
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      if (wishlisted) {
        const id = getWishlistItemId(product.id);
        if (id) await removeItem(id);
      } else {
        await addItem(product.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Find the primary image or fallback to the first one available
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;

  return (
    <div className={cn("group flex flex-col relative", className)}>
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary mb-4 rounded-sm">
        {primaryImage ? (
          <Image
            src={primaryImage.secureUrl}
            alt={primaryImage.altText || product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-muted/50">
            <span className="text-[10px] tracking-widest uppercase">No Image</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {!product.hasAvailableStock ? (
            <span className="bg-background/90 text-foreground text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-sm">
              Out of stock
            </span>
          ) : isOnSale ? (
            <span className="bg-destructive/90 text-destructive-foreground text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-sm">
              Sale
            </span>
          ) : product.isFeatured ? (
            <span className="bg-foreground/90 text-background text-[10px] font-medium tracking-widest uppercase px-2 py-1 rounded-sm">
              Featured
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-background/80 hover:bg-background rounded-full flex items-center justify-center transition-colors shadow-sm"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
        >
          <Heart className={cn("w-4 h-4 transition-colors", wishlisted ? "fill-foreground text-foreground" : "text-muted-foreground")} />
        </button>
      </Link>

      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-sm tracking-wide leading-tight group-hover:text-muted-foreground transition-colors">
          <Link href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className={cn("font-medium", !product.hasAvailableStock && "text-muted-foreground")}>
            {formatPrice(product.basePrice)}
          </span>
          {isOnSale && product.compareAtPrice !== null && (
            <span className="text-muted-foreground line-through text-xs">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-[3/4] bg-secondary mb-4 rounded-sm" />
      <div className="h-4 bg-secondary w-3/4 mb-2 rounded-sm" />
      <div className="h-4 bg-secondary w-1/4 rounded-sm" />
    </div>
  );
}
