"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

export function PaymentHandler({ order, paymentAttempt, onSuccess, onError, onClose }: PaymentHandlerProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
    if (!isScriptLoaded || isVerifying) return;

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable.");
      onError("Payment configuration error. Please contact support.");
      return;
    }

    const options = {
      // The public key used to initialize Razorpay checkout.
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentAttempt.amount * 100, // Assuming backend provides amount in base units, but Razorpay wants paise. Wait, backend usually gives amount. If backend gives paise, don't multiply.
      // Actually backend PaymentService passes order.totalAmount to createOrder. order.totalAmount is INR (e.g. 5000). Razorpay createOrder usually takes paise. Let's assume the providerOrder has amount in whatever unit Razorpay requires. We'll just pass what we got or let Razorpay fetch from order_id.
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
            razorpaySignature: response.razorpay_signature
          });
          onSuccess(order.id);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Payment verification failed. Your payment is under review.";
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
        color: "#000000"
      },
      modal: {
        ondismiss: function() {
          // User closed the modal
          onClose();
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', function (response: any){
        onError(response.error.description || "Payment failed");
      });
      rzp.open();
    } catch (err: unknown) {
      onError("Payment initialization failed");
    }
  }, [isScriptLoaded, paymentAttempt, order, onSuccess, onError, onClose, isVerifying]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      aria-describedby="payment-modal-desc"
    >
      <div className="flex flex-col items-center justify-center gap-5 p-8 bg-background border border-border/50 rounded-sm shadow-xl max-w-sm w-[90vw] text-center">
        <Loader2 className="w-10 h-10 animate-spin text-foreground" aria-hidden="true" />
        <div className="space-y-2">
          <h3 id="payment-modal-title" className="font-serif text-2xl tracking-tight">Processing Payment</h3>
          <p id="payment-modal-desc" className="text-sm text-muted-foreground leading-relaxed">
            {isVerifying ? "Verifying your payment securely. Please do not close this window." : "Please complete the payment in the secure window."}
          </p>
        </div>
      </div>
    </div>
  );
}
