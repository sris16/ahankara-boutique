"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { ProductSummary } from "@/types/catalog";
import { formatPrice, cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export interface ProductCardProps {
  product: ProductSummary;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isWishlisted, addItem, removeItem, getWishlistItemId } = useWishlist();
  const [isWishlistPending, setIsWishlistPending] = useState(false);

  const wishlisted = isWishlisted(product.id);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    if (isWishlistPending) return;

    try {
      setIsWishlistPending(true);
      if (wishlisted) {
        const id = getWishlistItemId(product.id);
        if (id) await removeItem(id);
      } else {
        await addItem(product.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsWishlistPending(false);
    }
  };

  // Find primary image and optional secondary editorial image
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const secondaryImage =
    product.images?.find((img) => !img.isPrimary && img.secureUrl !== primaryImage?.secureUrl) ||
    (product.images && product.images.length > 1 && product.images[1].secureUrl !== primaryImage?.secureUrl
      ? product.images[1]
      : null);
  const hasSecondaryImage = Boolean(secondaryImage && secondaryImage.secureUrl);

  const isOnSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.basePrice);

  return (
    <div className={cn("group flex flex-col relative", className)}>
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted mb-3 rounded-xs border border-border/40 transition-colors">
        {/* Clickable Image Container */}
        <Link
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block relative w-full h-full"
        >
          {/* Primary Product Image */}
          <ImageWithFallback
            src={primaryImage?.secureUrl || ""}
            alt={primaryImage?.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              "object-cover transition-all ease-[cubic-bezier(0.25,1,0.5,1)]",
              hasSecondaryImage
                ? "duration-500 group-hover:opacity-0 motion-reduce:opacity-100"
                : "duration-700 motion-safe:group-hover:scale-[1.025] motion-reduce:transform-none"
            )}
          />

          {/* Secondary Editorial Image Reveal on Desktop Hover (if available) */}
          {hasSecondaryImage && (
            <ImageWithFallback
              src={secondaryImage!.secureUrl}
              alt={secondaryImage!.altText || `${product.name} - Alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out motion-reduce:hidden pointer-events-none"
            />
          )}
        </Link>

        {/* Status Badges (Restrained Architectural Micro-labels) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none select-none">
          {!product.hasAvailableStock ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border/70 bg-background/90 text-muted-foreground backdrop-blur-sm shadow-2xs rounded-xs">
              Sold Out
            </span>
          ) : isOnSale ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-accent/40 bg-background/95 text-accent font-medium backdrop-blur-sm shadow-2xs rounded-xs">
              Sale
            </span>
          ) : product.isFeatured ? (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-foreground/20 bg-foreground/90 text-background backdrop-blur-sm shadow-2xs rounded-xs">
              Featured
            </span>
          ) : null}
        </div>

        {/* Wishlist Toggle Button (Separated from Link to prevent illegal nesting) */}
        <div className="absolute top-2 right-2 z-10">
          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={isWishlistPending}
            className={cn(
              "group/wishlist relative flex items-center justify-center w-8 h-8 rounded-xs",
              "bg-background/80 backdrop-blur-md border border-border/60",
              "hover:border-foreground/40 hover:bg-background transition-colors duration-200",
              "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
              "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              // 44px+ touch area for mobile ergonomics
              "before:absolute before:-inset-2 before:content-['']"
            )}
            aria-label={
              wishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={wishlisted}
          >
            {isWishlistPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-colors duration-200",
                  wishlisted
                    ? "fill-accent text-accent"
                    : "text-foreground/70 group-hover/wishlist:text-foreground"
                )}
              />
            )}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col gap-1">
        {/* Category Eyebrow */}
        {product.category?.name && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground line-clamp-1">
            {product.category.name}
          </span>
        )}

        {/* Product Title */}
        <h3 className="font-serif text-sm tracking-wide leading-snug group-hover:text-accent transition-colors duration-200">
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded-xs"
          >
            {product.name}
          </Link>
        </h3>

        {/* Pricing Hierarchy */}
        <div className="flex items-baseline gap-2 mt-0.5 text-sm">
          <span
            className={cn(
              "font-mono font-medium tracking-tight tabular-nums",
              !product.hasAvailableStock ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {isOnSale && <span className="sr-only">Current sale price: </span>}
            {formatPrice(product.basePrice)}
          </span>
          {isOnSale && product.compareAtPrice !== null && (
            <span className="font-mono text-muted-foreground line-through text-xs tabular-nums">
              <span className="sr-only">Original price: </span>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-hidden="true">
      <div className="aspect-[3/4] bg-surface-muted mb-3 rounded-xs border border-border/40 motion-safe:animate-pulse" />
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="h-2.5 bg-surface-muted w-1/4 rounded-xs motion-safe:animate-pulse" />
        <div className="h-3.5 bg-surface-muted w-4/5 rounded-xs motion-safe:animate-pulse" />
        <div className="h-3 bg-surface-muted w-1/3 mt-0.5 rounded-xs motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

