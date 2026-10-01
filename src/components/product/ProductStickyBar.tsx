"use client"

import * as React from "react"
import Image from "next/image"
import { ShoppingBag, Loader2 } from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"

interface ProductStickyBarProps {
  productName: string
  imageUrl?: string | null
  price: number
  isAddToCartDisabled: boolean
  isSubmitting: boolean
  onAddToCart: (e: React.FormEvent) => void
  targetElementId?: string
}

export function ProductStickyBar({
  productName,
  imageUrl,
  price,
  isAddToCartDisabled,
  isSubmitting,
  onAddToCart,
  targetElementId = "main-add-to-cart-btn",
}: ProductStickyBarProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const target = document.getElementById(targetElementId)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar only when the main CTA button is scrolled out of viewport
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetElementId])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border shadow-elevated px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-transform duration-standard ease-standard",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}
      role="region"
      aria-label="Quick purchase bar"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Thumbnail & Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {imageUrl ? (
            <div className="relative w-11 h-13 rounded-xs overflow-hidden shrink-0 border border-border/60 bg-surface-muted">
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
              />
            </div>
          ) : (
            <div className="w-11 h-13 rounded-xs border border-border/60 bg-surface-muted flex items-center justify-center shrink-0">
              <span className="font-serif text-[10px] text-muted-foreground">AS</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="text-xs font-normal text-foreground truncate block leading-tight">
              {productName}
            </span>
            <span className="text-sm font-semibold text-foreground font-mono mt-0.5 block">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isAddToCartDisabled || isSubmitting}
          className={cn(
            "h-11 px-5 rounded-xs text-xs uppercase tracking-[0.2em] font-medium shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-subtle",
            isAddToCartDisabled
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{isAddToCartDisabled ? "Unavailable" : "Add to Bag"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
