import Link from "next/link";
import { ProductSummary } from "@/types/catalog";
import { formatPrice, cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductSummary;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  // Find the primary image or fallback to the first one available
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.basePrice;

  return (
    <div className={cn("group flex flex-col relative", className)}>
      <Link href={`/products/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-secondary mb-4 rounded-sm">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage.secureUrl}
            alt={primaryImage.altText || product.name}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-muted/50">
            <span className="text-xs tracking-widest uppercase">No Image</span>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
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
      </Link>

      <div className="flex flex-col gap-1">
        <h3 className="font-medium text-sm leading-tight group-hover:underline decoration-1 underline-offset-4">
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
