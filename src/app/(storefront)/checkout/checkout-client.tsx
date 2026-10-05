"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { useAddress } from "@/hooks/use-address";
import { useCheckout } from "@/hooks/use-checkout";
import { checkoutApi } from "@/lib/api/checkout";
import { formatPrice } from "@/lib/utils";
import { AddressSelector } from "@/components/address/AddressSelector";
import { AddressForm } from "@/components/address/AddressForm";
import { PaymentHandler } from "@/components/checkout/PaymentHandler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useCallback } from "react";
import {
  Loader2,
  ShieldCheck,
  Tag,
  ArrowRight,
  Truck,
  User,
  ShoppingBag,
  AlertTriangle,
  ArrowLeft,
  X,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Order, PaymentAttemptResponse, CouponValidationResponse } from "@/types/checkout";
import { CreateAddressInput, Address } from "@/types/address";
import { CartResponse } from "@/types/cart";
import { useAuth } from "@/hooks/use-auth";

interface CheckoutClientProps {
  initialCart: CartResponse;
  initialPricing: CouponValidationResponse | null;
  initialAddresses: Address[];
}

export default function CheckoutClient({
  initialCart,
  initialPricing,
  initialAddresses,
}: CheckoutClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const { cart: contextCart } = useCart();
  const { addresses: contextAddresses, createAddress } = useAddress();

  const cart = contextCart || initialCart;
  const addresses = contextAddresses.length > 0 ? contextAddresses : initialAddresses;

  const {
    pricingInfo,
    appliedCoupon,
    couponError,
    error: pricingError,
    applyCoupon,
    clearCoupon,
    updatePricing,
    isProcessing: pricingProcessing,
  } = useCheckout();

  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);
  const [isBillingSame, setIsBillingSame] = useState(true);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Stable idempotency key for the lifetime of this checkout session
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  // Payment Phase State
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttemptResponse | null>(null);

  // Default address selection logic
  useEffect(() => {
    if (!selectedShippingId && addresses.length > 0) {
      const defaultShipping = addresses.find((a) => a.isDefaultShipping) || addresses[0];
      setTimeout(() => setSelectedShippingId(defaultShipping.id), 0);
    }
  }, [addresses, selectedShippingId]);

  // Fetch updated pricing whenever the selected shipping address changes
  useEffect(() => {
    if (selectedShippingId) {
      updatePricing(selectedShippingId, appliedCoupon || undefined).catch(console.error);
    }
  }, [selectedShippingId, appliedCoupon, updatePricing]);

  const handleAddressSubmit = async (data: CreateAddressInput) => {
    try {
      const newAddress = await createAddress(data);
      setSelectedShippingId(newAddress.id);
      setShowAddressForm(false);
      toast({
        variant: "success",
        title: "Address Saved",
        description: "Your atelier delivery destination has been recorded.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Failed to Save Address",
        description: error.message || "Please verify your input and try again.",
      });
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode.trim());
      toast({
        variant: "success",
        title: "Privilege Code Applied",
        description: `Code ${couponCode.toUpperCase().trim()} applied to checkout.`,
      });
      setCouponCode("");
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: error.message || "Failed to apply privilege code.",
      });
    }
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    toast({
      variant: "default",
      title: "Code Removed",
      description: "Privilege code removed from your order.",
    });
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedShippingId) {
      setCheckoutError("Please choose a delivery address to proceed.");
      toast({
        variant: "warning",
        title: "Address Required",
        description: "Please select or add a shipping destination.",
      });
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      // 1. Create the Order securely via the backend
      const order = await checkoutApi.createOrder(
        {
          shippingAddressId: selectedShippingId,
          billingAddressId: isBillingSame
            ? selectedShippingId
            : selectedBillingId || selectedShippingId,
          couponCode: appliedCoupon || undefined,
        },
        idempotencyKeyRef.current
      );

      setPendingOrder(order);

      // 2. Create the Payment Attempt
      const payment = await checkoutApi.createPaymentAttempt(order.id);
      setPaymentAttempt(payment);
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message || "Failed to process checkout. Please try again.";
      setCheckoutError(msg);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: msg,
      });
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    toast({
      variant: "success",
      title: "Order Confirmed",
      description: "Your creation has been reserved. Generating receipt...",
    });
    router.replace(`/order-confirmation/${orderId}`);
  };

  const handleVerificationUnknown = useCallback((orderId: string) => {
    toast({
      variant: "default",
      title: "Payment Processing",
      description: "Your payment is being confirmed. Please check your order status.",
    });
    router.replace(`/order-confirmation/${orderId}`);
  }, [toast, router]);

  const handlePaymentError = (errorMsg: string) => {
    const fullMsg = `Payment failed: ${errorMsg}`;
    setCheckoutError(fullMsg);
    toast({
      variant: "destructive",
      title: "Payment Authorization Failed",
      description: errorMsg || "Your card was not charged. Please try again.",
    });
    setIsSubmitting(false);
    setPaymentAttempt(null);
  };

  const handlePaymentClose = () => {
    setIsSubmitting(false);
    setPaymentAttempt(null);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping bag is empty"
          description="You need selections in your bag before proceeding with checkout."
          action={{
            label: "Explore Collection",
            href: "/products",
          }}
        />
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some(
    (i) =>
      i.availability.stockStatus !== "IN_STOCK" &&
      i.availability.stockStatus !== "LOW_STOCK"
  );

  // Authoritative Pricing Selection
  const activePricing = pricingInfo || initialPricing;
  const displaySubtotal = activePricing?.subtotal ?? cart.subtotal;
  const displayDiscount = activePricing?.discountAmount ?? 0;
  const displayShipping = activePricing?.shippingAmount ?? 0;
  const displayTax = activePricing?.taxAmount ?? 0;
  const displayTotal = activePricing?.totalAmount ?? cart.subtotal;
  const displayEstimatedDelivery = activePricing?.estimatedDeliveryAt;

  const isCheckoutDisabled =
    isSubmitting ||
    hasUnavailableItems ||
    !selectedShippingId ||
    pricingProcessing ||
    Boolean(pricingError);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 pb-28 lg:pb-16">
      {/* Screen reader live notification */}
      <div aria-live="polite" className="sr-only">
        {isSubmitting ? "Processing checkout securely..." : ""}
        {checkoutError ? `Error: ${checkoutError}` : ""}
      </div>

      {/* Editorial Breadcrumb / Header */}
      <div className="mb-10 pb-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bag</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground">
            Atelier Checkout
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Encrypted 256-Bit SSL Checkout</span>
        </div>
      </div>

      {/* Out of stock alert banner */}
      {hasUnavailableItems && (
        <div
          className="bg-destructive/10 text-destructive p-5 rounded-xs mb-8 border border-destructive/20 text-sm flex items-start gap-3.5"
          role="alert"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-1">Attention Required</strong>
            <p className="text-xs leading-relaxed opacity-90">
              One or more pieces in your selection are no longer available in the requested quantity. Please review your bag before placing your order.
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="h-9 text-xs uppercase tracking-wider">
                <Link href="/cart">Review Shopping Bag</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout error banner */}
      {checkoutError && (
        <div
          className="bg-destructive/10 text-destructive p-4 rounded-xs mb-8 border border-destructive/20 text-xs sm:text-sm font-medium flex items-center gap-2"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Form & Address Details */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
          {/* Step 1: Client Account Info */}
          <section className="bg-surface p-6 sm:p-7 rounded-xs border border-border/70 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono">
                  1
                </span>
                <span>Client Identification</span>
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-success flex items-center gap-1 font-medium">
                Verified
              </span>
            </div>
            <div className="flex items-center gap-3.5 p-3.5 rounded-xs bg-surface-muted/50 border border-border/40 text-xs">
              <div className="w-9 h-9 rounded-full bg-surface border border-border/80 flex items-center justify-center text-foreground shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{user?.name || "Atelier Guest"}</p>
                <p className="font-mono text-muted-foreground text-[11px] truncate">{user?.email}</p>
              </div>
            </div>
          </section>

          {/* Step 2: Shipping Destination */}
          <section className="bg-surface p-6 sm:p-7 rounded-xs border border-border/70 shadow-subtle">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-6 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>Delivery Destination</span>
            </h2>

            {showAddressForm ? (
              <AddressForm
                onCancel={() => setShowAddressForm(false)}
                onSubmit={handleAddressSubmit}
              />
            ) : (
              <AddressSelector
                addresses={addresses}
                selectedId={selectedShippingId}
                onSelect={setSelectedShippingId}
                onAddNew={() => setShowAddressForm(true)}
              />
            )}
          </section>

          {/* Step 3: Billing Address */}
          <section className="bg-surface p-6 sm:p-7 rounded-xs border border-border/70 shadow-subtle">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-5 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono">
                3
              </span>
              <span>Billing Address</span>
            </h2>

            <div className="flex items-center gap-2.5 p-3.5 rounded-xs bg-surface-muted/40 border border-border/40 mb-4">
              <input
                type="checkbox"
                id="sameAsShipping"
                checked={isBillingSame}
                onChange={(e) => setIsBillingSame(e.target.checked)}
                className="h-4 w-4 rounded-xs border-border/80 text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="sameAsShipping" className="text-xs text-foreground font-normal cursor-pointer select-none">
                Billing address matches delivery destination
              </label>
            </div>

            {!isBillingSame && (
              <div className="pt-2">
                <AddressSelector
                  addresses={addresses}
                  selectedId={selectedBillingId}
                  onSelect={setSelectedBillingId}
                  onAddNew={() => setShowAddressForm(true)}
                />
              </div>
            )}
          </section>

          {/* Step 4: Shipping Method */}
          <section className="bg-surface p-6 sm:p-7 rounded-xs border border-border/70 shadow-subtle">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground mb-5 flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-mono">
                4
              </span>
              <span>Delivery Method</span>
            </h2>

            <div className="p-4 rounded-xs border border-primary/40 bg-surface shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xs bg-surface-muted flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-foreground font-medium">
                      Complimentary Insured Courier Dispatch
                    </span>
                    <span className="text-[9px] uppercase tracking-widest bg-success/10 text-success px-1.5 py-0.5 rounded-xs font-mono font-semibold">
                      Free
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {displayEstimatedDelivery ? (
                      <>
                        Estimated delivery by{" "}
                        <strong className="text-foreground">
                          {new Date(displayEstimatedDelivery).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </strong>
                      </>
                    ) : (
                      "Dispatches within 24–48 hours in luxury archival packaging."
                    )}
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-success font-semibold shrink-0">
                ₹0
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
          <div className="bg-surface rounded-xs p-6 md:p-8 border border-border/70 shadow-subtle">
            <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-border/50">
              <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-foreground">
                Order Review
              </h2>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                ({cart.itemCount} {cart.itemCount === 1 ? "Piece" : "Pieces"})
              </span>
            </div>

            {/* Line Item Previews */}
            <div className="flex flex-col divide-y divide-border/40 max-h-[300px] overflow-y-auto pr-1 mb-6 border-b border-border/50 pb-6">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="flex gap-3.5 py-3 first:pt-0 last:pb-0">
                  <div className="relative w-14 aspect-[3/4] bg-surface-muted rounded-xs overflow-hidden shrink-0 border border-border/30">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-serif text-muted-foreground">
                        AHANKARA
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <p className="text-xs font-serif font-normal text-foreground truncate">{item.product.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        {item.variant.color && <span>{item.variant.color}</span>}
                        {item.variant.size && <span>• {item.variant.size}</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-[11px] text-muted-foreground font-mono">Qty: {item.quantity}</span>
                      <span className="font-mono font-medium text-foreground">{formatPrice(item.pricing.lineTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Application */}
            <div className="mb-6 pb-6 border-b border-border/50">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xs bg-surface-muted border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-accent" />
                    <span className="font-mono font-semibold text-foreground uppercase">{appliedCoupon}</span>
                    {displayDiscount > 0 && (
                      <span className="text-muted-foreground font-mono">(-{formatPrice(displayDiscount)})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label={`Remove coupon ${appliedCoupon}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <Input
                    placeholder="Privilege or promo code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-10 text-xs uppercase placeholder:normal-case font-mono rounded-xs"
                    disabled={pricingProcessing}
                    aria-label="Gift card or discount code"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!couponCode.trim() || pricingProcessing}
                    className="h-10 px-4 shrink-0 uppercase tracking-widest text-[11px] rounded-xs cursor-pointer"
                  >
                    {pricingProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                  </Button>
                </form>
              )}
              {couponError && <p className="text-xs text-destructive mt-2 font-mono" role="alert">{couponError}</p>}
            </div>

            {/* Totals Breakdown */}
            <div className="flex flex-col gap-3 text-sm mb-6 border-b border-border/50 pb-6">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-foreground">{formatPrice(displaySubtotal)}</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex justify-between items-center text-accent">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Privilege Discount</span>
                  </span>
                  <span className="font-mono tabular-nums font-medium">-{formatPrice(displayDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Insured Courier Dispatch</span>
                <span className="text-xs uppercase tracking-wider text-success font-medium font-mono">
                  {displayShipping === 0 ? "Complimentary" : formatPrice(displayShipping)}
                </span>
              </div>

              <div className="flex justify-between items-center text-muted-foreground">
                <span>Statutory GST</span>
                <span className="text-xs text-muted-foreground/80 font-mono">
                  {displayTax > 0 ? formatPrice(displayTax) : "Included in retail value"}
                </span>
              </div>
            </div>

            {/* Final Payable */}
            <div className="flex justify-between items-baseline mb-7" aria-live="polite">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-foreground">
                Payable Total
              </span>
              <div className="text-right">
                <span className="font-mono tabular-nums text-2xl sm:text-3xl font-medium tracking-tight text-foreground block">
                  {formatPrice(displayTotal)}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5 font-mono">
                  Secure Razorpay Payment
                </span>
              </div>
            </div>

            {/* Pricing Error Retry */}
            {pricingError && (
              <div className="mb-6 p-4 border border-destructive/20 bg-destructive/5 rounded-xs flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Pricing Unavailable</p>
                    <p className="text-xs text-muted-foreground mt-1">We couldn&apos;t update the pricing for your selected address. Please retry.</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs uppercase tracking-widest h-9"
                  onClick={() => selectedShippingId && updatePricing(selectedShippingId, appliedCoupon || undefined).catch(console.error)}
                  disabled={pricingProcessing || !selectedShippingId}
                >
                  {pricingProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RotateCcw className="w-3.5 h-3.5 mr-2" />}
                  Retry Pricing
                </Button>
              </div>
            )}

            {/* Desktop Place Order CTA */}
            <Button
              className="w-full h-14 uppercase tracking-[0.25em] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle rounded-xs"
              size="lg"
              onClick={handleCheckoutSubmit}
              disabled={isCheckoutDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing Checkout...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order & Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
              By authorizing, you agree to AHANKARA STUDIOS{" "}
              <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Payment Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/80 px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] shadow-elevated lg:hidden">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium font-mono">
              Total Payable
            </span>
            <span className="font-mono tabular-nums text-lg font-semibold tracking-tight text-foreground">
              {formatPrice(displayTotal)}
            </span>
          </div>

          {pricingError ? (
            <Button
              onClick={() => selectedShippingId && updatePricing(selectedShippingId, appliedCoupon || undefined).catch(console.error)}
              disabled={pricingProcessing || !selectedShippingId}
              variant="outline"
              className="flex-1 h-12 uppercase tracking-[0.2em] text-xs font-medium border-destructive/50 text-destructive hover:bg-destructive/10 rounded-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {pricingProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Pricing</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckoutSubmit}
              disabled={isCheckoutDisabled}
              className="flex-1 h-12 uppercase tracking-[0.2em] text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Place Order</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mount Payment Modal if attempt is active */}
      {paymentAttempt && pendingOrder && (
        <PaymentHandler
          order={pendingOrder}
          paymentAttempt={paymentAttempt}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onVerificationUnknown={handleVerificationUnknown}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
}
