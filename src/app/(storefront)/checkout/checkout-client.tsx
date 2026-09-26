"use client";

import { useEffect, useState } from "react";
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
import { Loader2, ShieldCheck, Tag } from "lucide-react";
import { Order, PaymentAttemptResponse, CouponValidationResponse } from "@/types/checkout";
import { CreateAddressInput, Address } from "@/types/address";
import { CartResponse } from "@/types/cart";

interface CheckoutClientProps {
  initialCart: CartResponse;
  initialPricing: CouponValidationResponse | null;
  initialAddresses: Address[];
}

export default function CheckoutClient({ initialCart, initialPricing, initialAddresses }: CheckoutClientProps) {
  const router = useRouter();

  // We still use these context providers to handle create/update actions
  // But we use the initial data for the first render to prevent SSR waterfalls
  const { cart: contextCart } = useCart();
  const { addresses: contextAddresses, createAddress } = useAddress();

  const cart = contextCart || initialCart;
  // If context hasn't loaded addresses, use initial. If it has, use context (so it updates if user adds one)
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

  // Payment Phase State
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [paymentAttempt, setPaymentAttempt] = useState<PaymentAttemptResponse | null>(null);

  // Default address selection logic
  useEffect(() => {
    if (!selectedShippingId && addresses.length > 0) {
      const defaultShipping = addresses.find(a => a.isDefaultShipping) || addresses[0];
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
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Failed to save address");
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await applyCoupon(couponCode.trim());
  };

  const handleCheckoutSubmit = async () => {
    if (!selectedShippingId) {
      setCheckoutError("Please select a shipping address.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    // Idempotency key for this submission attempt
    const idempotencyKey = crypto.randomUUID();

    try {
      // 1. Create the Order securely via the backend
      const order = await checkoutApi.createOrder({
        shippingAddressId: selectedShippingId,
        billingAddressId: isBillingSame ? selectedShippingId : (selectedBillingId || selectedShippingId),
        couponCode: appliedCoupon || undefined,
      }, idempotencyKey);

      setPendingOrder(order);

      // 2. Create the Payment Attempt
      const payment = await checkoutApi.createPaymentAttempt(order.id);
      setPaymentAttempt(payment);

    } catch (err: unknown) {
      const error = err as Error;
      setCheckoutError(error.message || "Failed to process checkout. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    router.replace(`/order-confirmation/${orderId}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setCheckoutError(`Payment failed: ${errorMsg}`);
    setIsSubmitting(false);
    setPaymentAttempt(null);
  };

  const handlePaymentClose = () => {
    setIsSubmitting(false);
    setPaymentAttempt(null);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <h1 className="font-serif text-3xl mb-4">Your bag is empty</h1>
        <p className="text-muted-foreground mb-8">You need items in your bag to checkout.</p>
        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const hasUnavailableItems = cart.items.some(i => i.availability.stockStatus !== 'IN_STOCK' && i.availability.stockStatus !== 'LOW_STOCK');

  // Authoritative Pricing Selection
  // If pricingInfo exists (from coupon API), use it.
  // Otherwise, fallback to initialPricing from SSR.
  // If neither, fallback to cart values (though initialPricing should always exist if cart > 0).
  const activePricing = pricingInfo || initialPricing;
  const displaySubtotal = activePricing?.subtotal ?? cart.subtotal;
  const displayDiscount = activePricing?.discountAmount ?? 0;
  const displayShipping = activePricing?.shippingAmount ?? 0;
  const displayTax = activePricing?.taxAmount ?? 0;
  const displayTotal = activePricing?.totalAmount ?? cart.subtotal;
  const displayEstimatedDelivery = activePricing?.estimatedDeliveryAt;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Accessibility live region for screen readers to announce async state changes */}
      <div aria-live="polite" className="sr-only">
        {isSubmitting ? "Processing checkout securely..." : ""}
        {checkoutError ? `Error: ${checkoutError}` : ""}
      </div>

      <h1 className="font-serif text-3xl mb-8 tracking-tight">Checkout</h1>

      {hasUnavailableItems && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-sm mb-8 border border-destructive/20 text-sm" role="alert">
          <strong>Action Required:</strong> One or more items in your cart are no longer available in the requested quantity. Please review your cart before checking out.
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/cart">Return to Cart</Link>
            </Button>
          </div>
        </div>
      )}

      {checkoutError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-sm mb-8 border border-destructive/20 text-sm" role="alert">
          {checkoutError}
        </div>
      )}

      {pricingError && !checkoutError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-sm mb-8 border border-destructive/20 text-sm" role="alert">
          {pricingError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Details */}
        <div className="flex-1 flex flex-col gap-10">

          {/* Shipping Address */}
          <section aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="text-lg font-medium tracking-wide uppercase mb-6 flex items-center gap-2">
              <span className="bg-foreground text-background w-6 h-6 rounded-full flex items-center justify-center text-xs" aria-hidden="true">1</span>
              Shipping Address
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

          {/* Billing Address */}
          <section className="border-t pt-10" aria-labelledby="billing-heading">
             <h2 id="billing-heading" className="text-lg font-medium tracking-wide uppercase mb-6 flex items-center gap-2">
              <span className="bg-foreground text-background w-6 h-6 rounded-full flex items-center justify-center text-xs" aria-hidden="true">2</span>
              Billing Address
            </h2>

            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                id="sameAsShipping"
                checked={isBillingSame}
                onChange={(e) => setIsBillingSame(e.target.checked)}
                className="rounded border-input text-foreground focus:ring-foreground cursor-pointer"
              />
              <label htmlFor="sameAsShipping" className="text-sm cursor-pointer select-none">
                Same as shipping address
              </label>
            </div>

            {!isBillingSame && (
              <AddressSelector
                addresses={addresses}
                selectedId={selectedBillingId}
                onSelect={setSelectedBillingId}
                onAddNew={() => setShowAddressForm(true)}
              />
            )}
          </section>

        </div>

        {/* Right Column: Summary */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="bg-muted/10 rounded-sm p-6 lg:sticky lg:top-24 border">
            <h2 className="font-serif text-xl mb-6 border-b pb-4">Order Summary</h2>

            {/* Items */}
            <div className="flex flex-col gap-4 mb-6 border-b pb-6">
              {cart.items.map((item) => (
                <div key={item.cartItemId} className="flex gap-4">
                  <div className="relative w-16 aspect-[3/4] bg-muted/20 rounded-sm overflow-hidden shrink-0">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/30" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.variant.color && <span>{item.variant.color}</span>}
                      {item.variant.size && <span> | {item.variant.size}</span>}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="text-sm font-medium">{formatPrice(item.pricing.lineTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupons */}
            <div className="mb-6 border-b pb-6">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-sm text-sm border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-medium tracking-wide uppercase">{appliedCoupon}</span>
                  </div>
                  <button
                    onClick={clearCoupon}
                    className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
                    aria-label={`Remove coupon ${appliedCoupon}`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="couponCode" className="sr-only">Discount Code</label>
                    <Input
                      id="couponCode"
                      placeholder="Gift card or discount code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="uppercase placeholder:normal-case w-full"
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={!couponCode.trim() || pricingProcessing}>
                    {pricingProcessing ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Applying coupon..." /> : "Apply"}
                  </Button>
                </form>
              )}
              {couponError && <p className="text-xs text-destructive mt-2" role="alert">{couponError}</p>}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-3 text-sm mb-6 border-b pb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(displaySubtotal)}</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{formatPrice(displayDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <div className="flex flex-col items-end">
                  <span>
                    {pricingProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : pricingError ? (
                      <span className="text-destructive">Unavailable</span>
                    ) : displayShipping === 0 ? (
                      "Free"
                    ) : (
                      formatPrice(displayShipping)
                    )}
                  </span>
                  {!pricingProcessing && displayEstimatedDelivery && (
                    <span className="text-xs text-muted-foreground mt-1">
                      Est. {new Date(displayEstimatedDelivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {displayTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>{formatPrice(displayTax)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="font-medium text-lg tracking-tight">Total</span>
              <span className="font-medium text-2xl tracking-tight">{formatPrice(displayTotal)}</span>
            </div>

            <Button
              className="w-full uppercase tracking-widest h-14 transition-all"
              size="lg"
              onClick={handleCheckoutSubmit}
              disabled={isSubmitting || hasUnavailableItems || !selectedShippingId || pricingProcessing || !!pricingError}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing Securely...</>
              ) : (
                <><ShieldCheck className="w-5 h-5 mr-2" /> Place Order</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Mount Payment Modal if attempt is active */}
      {paymentAttempt && pendingOrder && (
        <PaymentHandler
          order={pendingOrder}
          paymentAttempt={paymentAttempt}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
}
