"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice, cn } from "@/lib/utils";
import { CartItemResponse } from "@/types/cart";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Heart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CartItemRowProps {
  item: CartItemResponse;
  compact?: boolean;
  isUpdating: boolean;
  onUpdateQuantity: (cartItemId: string, newQty: number) => Promise<void>;
  onRemove: (cartItemId: string) => Promise<void>;
  onSaveToWishlist?: (productId: string, cartItemId: string) => Promise<void>;
  onItemClick?: () => void;
}

export function CartItemRow({
  item,
  compact = false,
  isUpdating,
  onUpdateQuantity,
  onRemove,
  onSaveToWishlist,
  onItemClick,
}: CartItemRowProps) {
  const stockIssue =
    item.availability.stockStatus !== "IN_STOCK" &&
    item.availability.stockStatus !== "LOW_STOCK";

  const isOnSale = Boolean(
    item.pricing.compareAtPrice &&
      item.pricing.compareAtPrice > item.pricing.unitPrice
  );

  return (
    <div
      className={cn(
        "group flex gap-4 transition-all duration-300",
        compact
          ? "py-4 border-b border-border/40 last:border-b-0"
          : "py-6 border-b border-border/60 last:border-b-0",
        isUpdating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Product Thumbnail */}
      <Link
        href={`/products/${item.product.slug}`}
        onClick={onItemClick}
        className={cn(
          "relative shrink-0 overflow-hidden bg-surface-muted rounded-xs border border-border/40 block",
          compact ? "w-20 aspect-[3/4]" : "w-24 sm:w-28 aspect-[3/4]"
        )}
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            sizes={compact ? "80px" : "(max-width: 640px) 96px, 112px"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-gradient-to-b from-surface-muted to-brand-50/40 select-none">
            <span className="font-serif text-[9px] uppercase tracking-[0.2em] text-muted-foreground/80 font-medium text-center">
              AHANKARA
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between min-w-0">
        <div>
          {/* Category / Atelier Tag & Price */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                onClick={onItemClick}
                className="font-serif text-sm sm:text-base font-normal tracking-wide text-foreground hover:text-accent transition-colors line-clamp-1 block"
              >
                {item.product.name}
              </Link>

              {/* Variant Specification Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                {item.variant.color && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-surface-muted text-[11px] font-mono tracking-wide uppercase">
                    {item.variant.color}
                  </span>
                )}
                {item.variant.size && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-surface-muted text-[11px] font-mono tracking-wide uppercase font-medium">
                    {item.variant.size}
                  </span>
                )}
              </div>
            </div>

            {/* Line Item Pricing */}
            <div className="text-right shrink-0">
              <span className="font-mono text-sm sm:text-base font-medium tracking-tight text-foreground block">
                {formatPrice(item.pricing.lineTotal)}
              </span>
              {isOnSale && item.pricing.compareAtPrice && (
                <span className="text-xs font-mono text-muted-foreground line-through block">
                  {formatPrice(item.pricing.compareAtPrice * item.quantity)}
                </span>
              )}
            </div>
          </div>

          {/* Stock Urgency / Issues */}
          {stockIssue && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-[10px] uppercase tracking-wider py-0.5 px-2">
                {item.availability.stockStatus === "INSUFFICIENT_STOCK"
                  ? `Only limited pieces in stock`
                  : item.availability.stockStatus === "OUT_OF_STOCK"
                  ? "Sold Out"
                  : "Unavailable"}
              </Badge>
            </div>
          )}
          {item.availability.stockStatus === "LOW_STOCK" && (
            <div className="mt-1.5">
              <span className="text-[11px] text-warning font-medium inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                Limited inventory remaining
              </span>
            </div>
          )}
        </div>

        {/* Controls & Actions Row */}
        <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-border/30">
          {/* Quantity Selector */}
          <QuantitySelector
            value={item.quantity}
            onChange={(newQty) => onUpdateQuantity(item.cartItemId, newQty)}
            min={1}
            max={stockIssue ? item.quantity : 10}
            disabled={isUpdating}
            size="sm"
          />

          {/* Actions: Save for later & Remove */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onSaveToWishlist && (
              <button
                type="button"
                onClick={() => onSaveToWishlist(item.product.id, item.cartItemId)}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Save ${item.product.name} to wishlist`}
                title="Save for later"
              >
                <Heart className="h-3.5 w-3.5 stroke-[1.5]" />
                <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Save</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onRemove(item.cartItemId)}
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Remove ${item.product.name} from bag`}
              title="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
