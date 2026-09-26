"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, MapPin } from "lucide-react";

interface DeliveryCheckerProps {
  productId: string;
  variantId?: string;
}

interface DeliveryResult {
  isServiceable: boolean;
  shippingAmount: number;
  estimatedDeliveryAt: string | null;
}

export function DeliveryChecker({ productId, variantId }: DeliveryCheckerProps) {
  const [postalCode, setPostalCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim() || !/^\d{6}$/.test(postalCode.trim())) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const url = new URL("/api/products/delivery", window.location.origin);
      url.searchParams.append("postalCode", postalCode.trim());

      if (variantId) {
        url.searchParams.append("variantId", variantId);
      } else {
        url.searchParams.append("productId", productId);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to check delivery");
      }

      setResult(data.data);
    } catch (err: unknown) {
      setError("Unable to check delivery right now. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-y border-input">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium tracking-widest uppercase">Delivery Options</h3>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 relative">
        <div className="flex-1 relative">
          <label htmlFor="postalCode" className="sr-only">PIN code</label>
          <input
            id="postalCode"
            type="text"
            maxLength={6}
            placeholder="Enter PIN code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
            className="w-full h-10 px-3 py-2 border border-input rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-shadow placeholder:text-muted-foreground"
            aria-invalid={!!error}
            aria-describedby={error ? "delivery-error" : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={isChecking || postalCode.length !== 6}
          className="h-10 px-6 bg-foreground text-background text-xs font-medium tracking-widest uppercase rounded-sm hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] flex items-center justify-center"
        >
          {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
        </button>
      </form>

      <div aria-live="polite" className="text-sm">
        {error && (
          <p id="delivery-error" className="text-destructive mt-1">{error}</p>
        )}

        {result && (
          <div className="mt-2 p-3 bg-muted/20 rounded-sm border">
            {result.isServiceable ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Delivery available</span>
                  </div>
                </div>

                <div className="pl-6 text-muted-foreground flex flex-col gap-1 text-xs">
                  {result.estimatedDeliveryAt && (
                    <p>Estimated delivery: <span className="font-medium text-foreground">{new Date(result.estimatedDeliveryAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                  )}
                  <p>Shipping: <span className="font-medium text-foreground">{result.shippingAmount === 0 ? "Free" : formatPrice(result.shippingAmount)}</span></p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>We currently don't deliver to this PIN code.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
