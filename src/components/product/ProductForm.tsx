"use client";

import { useState, useMemo } from "react";
import { ProductVariantDetail } from "@/types/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { ShoppingBag, Heart, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { DeliveryChecker } from "./DeliveryChecker";

interface ProductFormProps {
  productId: string;
  basePrice: number;
  compareAtPrice: number | null;
  variants: ProductVariantDetail[];
  hasAvailableStock: boolean;
}

export function ProductForm({ productId, basePrice, compareAtPrice, variants, hasAvailableStock }: ProductFormProps) {
  // Extract unique colors and sizes that are actually available in the variants list (null means none)
  const colors = useMemo(() => Array.from(new Set(variants.map(v => v.color).filter(Boolean) as string[])), [variants]);
  const sizes = useMemo(() => Array.from(new Set(variants.map(v => v.size).filter(Boolean) as string[])), [variants]);

  const [selectedColor, setSelectedColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);

  const { addItem: addCartItem, openCart } = useCart();
  const { addItem: addWishlistItem, removeItem: removeWishlistItem, isWishlisted, getWishlistItemId } = useWishlist();
  const { user } = useAuth();
  const router = useRouter();

  const [isSubmittingCart, setIsSubmittingCart] = useState(false);
  const [isSubmittingWishlist, setIsSubmittingWishlist] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  const wishlisted = isWishlisted(productId);

  // Determine the currently selected variant based on color and size
  const selectedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    
    // If there are no color options globally, treat selectedColor as matched
    const colorMatch = colors.length === 0 ? null : selectedColor;
    const sizeMatch = sizes.length === 0 ? null : selectedSize;

    return variants.find(v => v.color === colorMatch && v.size === sizeMatch) || null;
  }, [variants, colors.length, sizes.length, selectedColor, selectedSize]);

  const currentPrice = selectedVariant ? selectedVariant.effectivePrice : basePrice;
  const currentComparePrice = selectedVariant 
    ? selectedVariant.compareAtPrice 
    : compareAtPrice;

  // Helper to check if a specific color/size combo actually exists and is available
  const isSizeAvailableForColor = (size: string) => {
    if (!selectedColor && colors.length > 0) return true; // Show all until color picked
    const v = variants.find(v => (colors.length === 0 || v.color === selectedColor) && v.size === size);
    return v ? v.available : false;
  };

  const isColorAvailableForSize = (color: string) => {
    if (!selectedSize && sizes.length > 0) return true; // Show all until size picked
    const v = variants.find(v => v.color === color && (sizes.length === 0 || v.size === selectedSize));
    return v ? v.available : false;
  };

  const isAddToCartDisabled = () => {
    if (!hasAvailableStock) return true;
    if (variants.length === 0) return false; // Single product with no variants
    if (colors.length > 0 && !selectedColor) return true;
    if (sizes.length > 0 && !selectedSize) return true;
    if (selectedVariant && !selectedVariant.available) return true;
    return false;
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddToCartDisabled() || isSubmittingCart || !selectedVariant) return;
    
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSubmittingCart(true);
    setCartSuccess(false);
    try {
      await addCartItem(selectedVariant.id, 1);
      setCartSuccess(true);
      openCart();
      setTimeout(() => setCartSuccess(false), 3000); // clear success msg
    } catch {
      // The error is already caught/handled by context, we just stop loading
      alert("Failed to add to cart. Please try again.");
    } finally {
      setIsSubmittingCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSubmittingWishlist(true);
    try {
      if (wishlisted) {
        const id = getWishlistItemId(productId);
        if (id) {
          await removeWishlistItem(id);
        }
      } else {
        await addWishlistItem(productId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWishlist(false);
    }
  };

  return (
    <form onSubmit={handleAddToCart} className="flex flex-col gap-8">
      {/* Price Display */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-medium tracking-tight">
          {formatPrice(currentPrice)}
        </span>
        {currentComparePrice !== null && currentComparePrice > currentPrice && (
          <span className="text-muted-foreground line-through text-lg">
            {formatPrice(currentComparePrice)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-widest uppercase">Color</span>
              <span className="text-sm text-muted-foreground">{selectedColor || "Select color"}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const available = isColorAvailableForSize(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    disabled={!available}
                    aria-pressed={selectedColor === color}
                    aria-label={`Color ${color}${!available ? ' (Unavailable)' : ''}`}
                    className={cn(
                      "px-4 py-2 border rounded-sm text-sm transition-colors",
                      selectedColor === color 
                        ? "border-foreground bg-foreground text-background" 
                        : "border-input hover:border-foreground",
                      !available && "opacity-50 cursor-not-allowed line-through hover:border-input text-muted-foreground"
                    )}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-widest uppercase">Size</span>
              <span className="text-sm text-muted-foreground">{selectedSize || "Select size"}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {sizes.map((size) => {
                const available = isSizeAvailableForColor(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    disabled={!available}
                    aria-pressed={selectedSize === size}
                    aria-label={`Size ${size}${!available ? ' (Unavailable)' : ''}`}
                    className={cn(
                      "min-w-[3rem] px-4 py-2 border rounded-sm text-sm transition-colors text-center",
                      selectedSize === size 
                        ? "border-foreground bg-foreground text-background" 
                        : "border-input hover:border-foreground",
                      !available && "opacity-50 cursor-not-allowed hover:border-input text-muted-foreground"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stock Status */}
      {selectedVariant && (
        <div className="text-sm">
          {selectedVariant.stockStatus === 'OUT_OF_STOCK' && (
            <span className="text-destructive font-medium">Out of stock in this selection</span>
          )}
          {selectedVariant.stockStatus === 'LOW_STOCK' && (
            <span className="text-amber-600 font-medium">Only a few left</span>
          )}
          {selectedVariant.stockStatus === 'IN_STOCK' && (
            <span className="text-green-600 font-medium">In stock</span>
          )}
        </div>
      )}

      {!hasAvailableStock && variants.length === 0 && (
        <div className="text-sm text-destructive font-medium">Out of stock</div>
      )}

      <DeliveryChecker productId={productId} variantId={selectedVariant?.id} />

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isAddToCartDisabled() || isSubmittingCart}
          className={cn(
            "flex-1 py-4 px-8 flex items-center justify-center gap-2 rounded-sm text-sm font-medium tracking-widest uppercase transition-all",
            isAddToCartDisabled()
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : cartSuccess 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {isSubmittingCart ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : cartSuccess ? (
            "Added to Cart"
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              {isAddToCartDisabled() ? "Unavailable" : "Add to Cart"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isSubmittingWishlist}
          className="h-auto aspect-square px-4 border border-input rounded-sm hover:border-foreground transition-colors flex items-center justify-center disabled:opacity-50"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isSubmittingWishlist ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Heart className={cn("w-5 h-5 transition-colors", wishlisted ? "fill-foreground" : "text-muted-foreground")} />
          )}
        </button>
      </div>
    </form>
  );
}
