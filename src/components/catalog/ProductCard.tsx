"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductSummary } from "@/types/catalog";
import { formatPrice, cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

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
  const isOnSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.basePrice);

  return (
    <div className={cn("group flex flex-col relative", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-[3/4] overflow-hidden bg-surface-muted mb-3.5 rounded-xs border border-border/40 transition-colors"
      >
        {primaryImage ? (
          <Image
            src={primaryImage.secureUrl}
            alt={primaryImage.altText || product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gradient-to-b from-surface-muted to-brand-50/60 select-none">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border/60 mb-2 opacity-50">
              <Image
                src="/images/brand/ahankara-studios-logo.jpg"
                alt="AHANKARA STUDIOS"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <span className="font-serif text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 font-medium text-center">
              AHANKARA
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
              Atelier Piece
            </span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {!product.hasAvailableStock ? (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-background/90 backdrop-blur-sm shadow-xs">
              Sold Out
            </Badge>
          ) : isOnSale ? (
            <Badge variant="destructive" className="text-[10px] uppercase tracking-widest px-2 py-0.5 shadow-xs">
              Sale
            </Badge>
          ) : product.isFeatured ? (
            <Badge variant="default" className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-foreground/90 text-background backdrop-blur-sm shadow-xs">
              Featured
            </Badge>
          ) : null}
        </div>

        {/* Wishlist Button - minimum 44px tap zone on mobile */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-background/85 backdrop-blur-md border border-border/60 hover:bg-background flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105 active:scale-95 cursor-pointer relative before:absolute before:-inset-2 before:content-['']"
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={wishlisted}
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-colors duration-200",
                wishlisted
                  ? "fill-accent text-accent"
                  : "text-foreground/70 hover:text-foreground"
              )}
            />
          </button>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-sm tracking-wide leading-tight group-hover:text-accent transition-colors duration-200">
          <Link href={`/products/${product.slug}`} className="line-clamp-1">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-2 mt-0.5 text-sm">
          <span
            className={cn(
              "font-medium tracking-tight tabular-nums",
              !product.hasAvailableStock ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {formatPrice(product.basePrice)}
          </span>
          {isOnSale && product.compareAtPrice !== null && (
            <span className="text-muted-foreground line-through text-xs tabular-nums">
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
      <div className="aspect-[3/4] bg-surface-muted mb-3.5 rounded-xs border border-border/40" />
      <div className="h-4 bg-surface-muted w-3/4 mb-2 rounded-xs" />
      <div className="h-4 bg-surface-muted w-1/4 rounded-xs" />
    </div>
  );
}

