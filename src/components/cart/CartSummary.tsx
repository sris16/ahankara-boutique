"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ArrowRight, Tag, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { checkoutApi } from "@/lib/api/checkout";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface AppliedCouponInfo {
  code: string;
  discountAmount: number;
}

export function CartSummary({
  subtotal,
  itemCount,
  onCheckout,
  isLoading = false,
  disabled = false,
}: CartSummaryProps) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || isValidating) return;

    setIsValidating(true);
    try {
      const data = await checkoutApi.validateCoupon(couponCode.trim());

      setAppliedCoupon({
        code: data.coupon?.code || couponCode.toUpperCase().trim(),
        discountAmount: data.discountAmount || 0,
      });

      toast({
        variant: "success",
        title: "Privilege Code Applied",
        description: `Code ${data.coupon?.code || couponCode} has been applied to your order.`,
      });
      setCouponCode("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: err instanceof Error ? err.message : "Unable to validate coupon code.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast({
      variant: "default",
      title: "Code Removed",
      description: "Privilege code was removed from order calculation.",
    });
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="bg-surface rounded-xs p-6 md:p-8 border border-border/70 shadow-subtle">
      <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-foreground mb-6 pb-3 border-b border-border/40">
        Order Summary
      </h2>

      {/* Itemized Calculation */}
      <div className="flex flex-col gap-3.5 text-sm border-b border-border/50 pb-6 mb-6">
        <div className="flex justify-between items-center text-muted-foreground">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "piece" : "pieces"})</span>
          <span className="font-mono tabular-nums text-foreground">{formatPrice(subtotal)}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center text-accent">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              <span>Privilege ({appliedCoupon.code})</span>
            </span>
            <span className="font-mono tabular-nums font-medium">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Shipping & Handling</span>
          <span className="text-xs uppercase tracking-wider text-success font-medium font-mono">
            Complimentary
          </span>
        </div>

        <div className="flex justify-between items-center text-muted-foreground">
          <span>Duties & Taxes</span>
          <span className="text-xs text-muted-foreground/80 font-mono">Included (GST)</span>
        </div>
      </div>

      {/* Coupon Application Form */}
      <div className="mb-6 pb-6 border-b border-border/50">
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 rounded-xs bg-surface-muted border border-border/60 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono font-semibold text-foreground uppercase">
                {appliedCoupon.code}
              </span>
              <span className="text-muted-foreground font-mono">
                (-{formatPrice(discountAmount)})
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Remove coupon"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <Input
              type="text"
              placeholder="Promo or privilege code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="h-10 text-xs uppercase placeholder:normal-case font-mono rounded-xs"
              disabled={isValidating || disabled}
              aria-label="Promo or privilege code"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!couponCode.trim() || isValidating || disabled}
              className="h-10 px-4 shrink-0 uppercase tracking-widest text-[11px] rounded-xs cursor-pointer"
            >
              {isValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
            </Button>
          </form>
        )}
      </div>

      {/* Final Total */}
      <div className="flex justify-between items-baseline mb-7" aria-live="polite">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground">
          Estimated Total
        </span>
        <div className="text-right">
          <span className="font-mono tabular-nums text-2xl sm:text-3xl font-medium tracking-tight text-foreground block">
            {formatPrice(finalTotal)}
          </span>
          <span className="text-[11px] text-muted-foreground block mt-0.5 font-mono">
            All prices include statutory GST
          </span>
        </div>
      </div>

      {/* Checkout CTA */}
      <Button
        onClick={onCheckout}
        disabled={disabled || isLoading || itemCount === 0}
        size="lg"
        className="w-full h-13 uppercase tracking-[0.25em] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle rounded-xs"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="h-4 w-4" />
      </Button>

      {/* Assurance / Trust Footnote */}
      <div className="flex items-center justify-center gap-2 mt-5 text-[11px] text-muted-foreground text-center">
        <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
        <span>Atelier Certified Packaging & Insured Courier Dispatch</span>
      </div>
    </div>
  );
}
