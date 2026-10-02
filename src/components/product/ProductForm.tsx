"use client"

import * as React from "react"
import { ProductVariantDetail } from "@/types/catalog"
import { cn, formatPrice } from "@/lib/utils"
import { ShoppingBag, Heart, Loader2, Ruler } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { QuantitySelector } from "@/components/ui/quantity-selector"
import { Badge } from "@/components/ui/badge"
import { DeliveryChecker } from "./DeliveryChecker"
import { ProductSizeGuide } from "./ProductSizeGuide"
import { ProductStickyBar } from "./ProductStickyBar"

interface ProductFormProps {
  productId: string
  productName: string
  imageUrl?: string | null
  basePrice: number
  compareAtPrice: number | null
  variants: ProductVariantDetail[]
  hasAvailableStock: boolean
}

export function ProductForm({
  productId,
  productName,
  imageUrl,
  basePrice,
  compareAtPrice,
  variants,
  hasAvailableStock,
}: ProductFormProps) {
  // Extract unique colors and sizes
  const colors = React.useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[])),
    [variants]
  )
  const sizes = React.useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[])),
    [variants]
  )

  const [selectedColor, setSelectedColor] = React.useState<string | null>(
    colors.length === 1 ? colors[0] : null
  )
  const [selectedSize, setSelectedSize] = React.useState<string | null>(
    sizes.length === 1 ? sizes[0] : null
  )
  const [quantity, setQuantity] = React.useState(1)
  const [sizeGuideOpen, setSizeGuideOpen] = React.useState(false)

  const { addItem: addCartItem, openCart } = useCart()
  const { addItem: addWishlistItem, removeItem: removeWishlistItem, isWishlisted, getWishlistItemId } = useWishlist()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isSubmittingCart, setIsSubmittingCart] = React.useState(false)
  const [isSubmittingWishlist, setIsSubmittingWishlist] = React.useState(false)
  const [cartSuccess, setCartSuccess] = React.useState(false)

  const wishlisted = isWishlisted(productId)

  // Determine active variant
  const selectedVariant = React.useMemo(() => {
    if (variants.length === 0) return null

    const colorMatch = colors.length === 0 ? null : selectedColor
    const sizeMatch = sizes.length === 0 ? null : selectedSize

    return variants.find((v) => v.color === colorMatch && v.size === sizeMatch) || null
  }, [variants, colors.length, sizes.length, selectedColor, selectedSize])

  const currentPrice = selectedVariant ? selectedVariant.effectivePrice : basePrice
  const currentComparePrice = selectedVariant
    ? selectedVariant.compareAtPrice
    : compareAtPrice

  const hasDiscount = Boolean(
    currentComparePrice !== null && currentComparePrice > currentPrice
  )
  const discountPercent = hasDiscount && currentComparePrice
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0

  // Availability helpers
  const isSizeAvailableForColor = (size: string) => {
    if (!selectedColor && colors.length > 0) return true
    const v = variants.find(
      (v) => (colors.length === 0 || v.color === selectedColor) && v.size === size
    )
    return v ? v.available : false
  }

  const isColorAvailableForSize = (color: string) => {
    if (!selectedSize && sizes.length > 0) return true
    const v = variants.find(
      (v) => v.color === color && (sizes.length === 0 || v.size === selectedSize)
    )
    return v ? v.available : false
  }

  const isAddToCartDisabled = () => {
    if (!hasAvailableStock) return true
    if (variants.length === 0) return false
    if (colors.length > 0 && !selectedColor) return true
    if (sizes.length > 0 && !selectedSize) return true
    if (selectedVariant && !selectedVariant.available) return true
    return false
  }

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAddToCartDisabled() || isSubmittingCart) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!selectedVariant && variants.length > 0) {
      toast({
        variant: "warning",
        title: "Selection Incomplete",
        description: "Please choose your preferred size and color.",
      })
      return
    }

    setIsSubmittingCart(true)
    setCartSuccess(false)

    try {
      const targetVariantId = selectedVariant ? selectedVariant.id : variants[0]?.id
      if (!targetVariantId) throw new Error("No variant available")

      await addCartItem(targetVariantId, quantity)
      setCartSuccess(true)
      openCart()

      toast({
        variant: "success",
        title: "Added to Shopping Bag",
        description: `${quantity} ${quantity === 1 ? "creation" : "creations"} added to your bag.`,
      })

      setTimeout(() => setCartSuccess(false), 3000)
    } catch {
      toast({
        variant: "destructive",
        title: "Reservation Failed",
        description: "Unable to add this creation to your shopping bag. Please try again.",
      })
    } finally {
      setIsSubmittingCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    setIsSubmittingWishlist(true)
    try {
      if (wishlisted) {
        const id = getWishlistItemId(productId)
        if (id) {
          await removeWishlistItem(id)
          toast({
            variant: "default",
            title: "Removed from Wishlist",
            description: "Item removed from your saved pieces.",
          })
        }
      } else {
        await addWishlistItem(productId)
        toast({
          variant: "success",
          title: "Saved to Wishlist",
          description: "Piece added to your private collection.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Wishlist Error",
        description: "Unable to update your wishlist. Please try again.",
      })
    } finally {
      setIsSubmittingWishlist(false)
    }
  }

  return (
    <>
      <form onSubmit={handleAddToCart} className="flex flex-col gap-7 select-none">
        {/* Price & Discount Display */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-3.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-normal font-mono tracking-tight text-foreground">
              {formatPrice(currentPrice)}
            </span>
            {hasDiscount && currentComparePrice && (
              <span className="text-muted-foreground line-through text-base sm:text-lg font-mono">
                {formatPrice(currentComparePrice)}
              </span>
            )}
            {hasDiscount && (
              <Badge variant="accent" className="text-xs uppercase tracking-wider px-2 py-0.5 font-medium">
                Save {discountPercent}%
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground/80 tracking-wide">
            Inclusive of all duties & taxes. Complimentary insured delivery.
          </span>
        </div>

        {/* Options & Variants */}
        <div className="flex flex-col gap-5 pt-2">
          {/* Colors */}
          {colors.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">
                  Color: <strong className="font-semibold text-foreground ml-1">{selectedColor || "Select"}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Available Colors">
                {colors.map((color) => {
                  const available = isColorAvailableForSize(color)
                  const isSelected = selectedColor === color
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedColor(color)}
                      disabled={!available}
                      className={cn(
                        "px-4 py-2 rounded-xs text-xs uppercase tracking-wider font-medium border transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                          : "border-border bg-surface text-foreground hover:border-primary",
                        !available && "opacity-40 cursor-not-allowed line-through hover:border-border text-muted-foreground bg-surface-muted"
                      )}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">
                  Size: <strong className="font-semibold text-foreground ml-1">{selectedSize || "Select"}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors uppercase tracking-wider cursor-pointer underline underline-offset-4"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Available Sizes">
                {sizes.map((size) => {
                  const available = isSizeAvailableForColor(size)
                  const isSelected = selectedSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedSize(size)}
                      disabled={!available}
                      className={cn(
                        "min-w-[48px] h-11 px-3.5 rounded-xs text-xs font-mono tracking-wider font-medium border transition-all flex items-center justify-center cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                          : "border-border bg-surface text-foreground hover:border-primary",
                        !available && "opacity-40 cursor-not-allowed hover:border-border text-muted-foreground bg-surface-muted relative overflow-hidden"
                      )}
                    >
                      {size}
                      {!available && (
                        <span className="sr-only">(Unavailable)</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Stock Status Badge */}
        {selectedVariant && (
          <div className="text-xs flex items-center gap-2">
            {selectedVariant.stockStatus === "OUT_OF_STOCK" && (
              <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Sold out in selected configuration
              </span>
            )}
            {selectedVariant.stockStatus === "LOW_STOCK" && (
              <span className="inline-flex items-center gap-1.5 text-warning font-medium">
                <span className="h-2 w-2 rounded-full bg-warning motion-safe:animate-pulse" />
                Only a few handcrafted pieces remaining
              </span>
            )}
            {selectedVariant.stockStatus === "IN_STOCK" && (
              <span className="inline-flex items-center gap-1.5 text-success font-medium">
                <span className="h-2 w-2 rounded-full bg-success" />
                In stock — Ready for immediate atelier dispatch
              </span>
            )}
          </div>
        )}

        {!hasAvailableStock && variants.length === 0 && (
          <div className="text-xs text-destructive font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Currently out of stock
          </div>
        )}

        {/* Quantity Controller */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">
            Quantity
          </span>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={5}
            disabled={isAddToCartDisabled() || isSubmittingCart}
          />
        </div>

        {/* Delivery Estimator */}
        <DeliveryChecker productId={productId} variantId={selectedVariant?.id} />

        {/* Primary CTAs */}
        <div className="flex items-center gap-3.5 pt-2">
          <button
            id="main-add-to-cart-btn"
            type="submit"
            disabled={isAddToCartDisabled() || isSubmittingCart}
            className={cn(
              "flex-1 h-13 px-8 flex items-center justify-center gap-2.5 rounded-xs text-xs font-medium tracking-[0.25em] uppercase transition-all cursor-pointer shadow-subtle",
              isAddToCartDisabled()
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : cartSuccess
                ? "bg-success text-success-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]"
            )}
          >
            {isSubmittingCart ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cartSuccess ? (
              "Added to Shopping Bag"
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>{isAddToCartDisabled() ? "Unavailable" : "Add to Shopping Bag"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWishlistToggle}
            disabled={isSubmittingWishlist}
            className={cn(
              "h-13 w-13 rounded-xs border border-border bg-surface flex items-center justify-center transition-all cursor-pointer hover:border-primary disabled:opacity-50",
              wishlisted ? "text-accent border-accent/40" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isSubmittingWishlist ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Heart
                className={cn(
                  "h-5 w-5 transition-transform duration-fast active:scale-125",
                  wishlisted ? "fill-accent text-accent" : "stroke-[1.5]"
                )}
              />
            )}
          </button>
        </div>
      </form>

      {/* Sizing Guide Modal */}
      <ProductSizeGuide
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />

      {/* Mobile Bottom Sticky Purchase Bar */}
      <ProductStickyBar
        productName={productName}
        imageUrl={imageUrl}
        price={currentPrice}
        isAddToCartDisabled={isAddToCartDisabled()}
        isSubmitting={isSubmittingCart}
        onAddToCart={handleAddToCart}
        targetElementId="main-add-to-cart-btn"
      />
    </>
  )
}
