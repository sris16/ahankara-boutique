"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { checkoutApi } from "@/lib/api/checkout";
import { PaymentAttemptResponse, Order } from "@/types/checkout";

interface PaymentHandlerProps {
  order: Order;
  paymentAttempt: PaymentAttemptResponse;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function PaymentHandler({
  order,
  paymentAttempt,
  onSuccess,
  onError,
  onClose,
}: PaymentHandlerProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Track initialization to prevent duplicate Razorpay opens on React re-renders
  const initializedOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setIsScriptLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => onError("Failed to load payment gateway");
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, [onError]);

  useEffect(() => {
    if (!isScriptLoaded) return;

    // Prevent duplicate initialization for the same payment attempt
    if (initializedOrderIdRef.current === paymentAttempt.providerOrderId) return;

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable.");
      onError("Payment configuration error. Please contact support.");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentAttempt.amount, // in Paise
      currency: paymentAttempt.currency,
      name: "AHANKARA STUDIOS",
      description: `Order ${order.orderNumber}`,
      order_id: paymentAttempt.providerOrderId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async function (response: any) {
        setIsVerifying(true);
        try {
          await checkoutApi.verifyPayment(order.id, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          onSuccess(order.id);
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : "Payment verification failed. Your payment is under review.";
          onError(msg);
        } finally {
          setIsVerifying(false);
        }
      },
      prefill: {
        name: order.shippingAddress.name,
        contact: order.shippingAddress.phone,
      },
      theme: {
        color: "#181411", // Deep obsidian espresso
      },
      modal: {
        ondismiss: function () {
          onClose();
        },
      },
    };

    try {
      initializedOrderIdRef.current = paymentAttempt.providerOrderId;
      const rzp = new window.Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on("payment.failed", function (response: any) {
        onError(response.error.description || "Payment failed");
      });
      rzp.open();
    } catch {
      initializedOrderIdRef.current = null;
      onError("Payment initialization failed");
    }
  }, [isScriptLoaded, paymentAttempt, order, onSuccess, onError, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-opacity duration-300 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      aria-describedby="payment-modal-desc"
    >
      <div className="flex flex-col items-center justify-center gap-6 p-8 sm:p-10 bg-surface border border-border/80 rounded-xs shadow-elevated max-w-md w-full text-center relative overflow-hidden">
        {/* Subtle accent hairline */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent/50 via-primary to-accent/50" />

        <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
          <Lock className="w-4 h-4 text-accent absolute" />
        </div>

        <div className="space-y-2.5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">
            Razorpay Secure Gateway
          </span>
          <h3
            id="payment-modal-title"
            className="font-serif text-2xl font-normal tracking-tight text-foreground"
          >
            {isVerifying ? "Verifying Transaction" : "Awaiting Authorization"}
          </h3>
          <p
            id="payment-modal-desc"
            className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto"
          >
            {isVerifying
              ? "Confirming bank verification and updating your order. Please do not refresh or close this browser window."
              : "Complete the transaction in the secure Razorpay payment window to reserve your handcrafted selection."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground w-full">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>256-Bit Bank Level Encryption Verified</span>
        </div>
      </div>
    </div>
  );
}
