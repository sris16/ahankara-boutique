"use client"

import * as React from "react"
import { formatPrice } from "@/lib/utils"
import { CheckCircle2, XCircle, Loader2, MapPin, Truck } from "lucide-react"

interface DeliveryCheckerProps {
  productId: string
  variantId?: string
}

interface DeliveryResult {
  isServiceable: boolean
  shippingAmount: number
  estimatedDeliveryAt: string | null
}

export function DeliveryChecker({ productId, variantId }: DeliveryCheckerProps) {
  const [postalCode, setPostalCode] = React.useState("")
  const [isChecking, setIsChecking] = React.useState(false)
  const [result, setResult] = React.useState<DeliveryResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedCode = postalCode.trim()
    if (!cleanedCode || !/^\d{6}$/.test(cleanedCode)) {
      setError("Please enter a valid 6-digit Indian PIN code.")
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const url = new URL("/api/products/delivery", window.location.origin)
      url.searchParams.append("postalCode", cleanedCode)

      if (variantId) {
        url.searchParams.append("variantId", variantId)
      } else {
        url.searchParams.append("productId", productId)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to check delivery")
      }

      setResult(data.data)
    } catch {
      setError("Unable to verify delivery service for this location. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-3.5 py-6 border-y border-border/60">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent stroke-[1.5]" />
        <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">
          Delivery Options & Dispatch
        </h3>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="flex-1 relative">
          <label htmlFor="postalCode" className="sr-only">PIN code</label>
          <input
            id="postalCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit PIN code"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value.replace(/\D/g, ""))
              if (error) setError(null)
            }}
            className="w-full h-11 px-3.5 bg-surface border border-border rounded-xs text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal"
            aria-invalid={!!error}
            aria-describedby={error ? "delivery-error" : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={isChecking || postalCode.length !== 6}
          className="h-11 px-6 bg-primary text-primary-foreground text-xs font-medium tracking-[0.2em] uppercase rounded-xs hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[100px] flex items-center justify-center cursor-pointer shadow-subtle"
        >
          {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
        </button>
      </form>

      <div aria-live="polite" className="text-xs">
        {error && (
          <p id="delivery-error" className="text-destructive font-medium mt-1">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-2 p-3.5 bg-surface-muted/50 rounded-xs border border-border/80 animate-in fade-in duration-fast">
            {result.isServiceable ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-success font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  <span>Express Delivery Available</span>
                </div>

                <div className="pl-6 text-muted-foreground flex flex-col gap-1 text-xs">
                  {result.estimatedDeliveryAt && (
                    <p className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span>
                        Estimated Dispatch:{" "}
                        <strong className="font-medium text-foreground">
                          {new Date(result.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    </p>
                  )}
                  <p>
                    Shipping Fee:{" "}
                    <strong className="font-medium text-foreground">
                      {result.shippingAmount === 0 ? "Complimentary" : formatPrice(result.shippingAmount)}
                    </strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>We currently do not offer standard courier delivery to this PIN code. Please reach out to our concierge for bespoke delivery.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
