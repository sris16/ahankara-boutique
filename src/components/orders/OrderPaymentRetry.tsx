"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface OrderPaymentRetryProps {
  orderId: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export function OrderPaymentRetry({ orderId }: OrderPaymentRetryProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentRetry = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // 2. Fetch Payment Attempt from Server (Server Authoritative)
      const res = await fetch(`/api/me/orders/${orderId}/payment`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to initialize payment");
      }

      const paymentAttempt = data.data;

      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error("Payment configuration error. Please contact support.");
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentAttempt.amount * 100, // assuming backend is INR, Razorpay wants paise. If backend is paise, remove *100. The checkout uses *100.
        currency: paymentAttempt.currency,
        name: "AHANKARA STUDIOS",
        description: `Order Payment Retry`,
        order_id: paymentAttempt.providerOrderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          try {
            // 4. Verify Payment Signature
            const verifyRes = await fetch(`/api/me/orders/${orderId}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error?.message || "Payment verification failed");
            }

            // Success! Refresh the page to show new status
            router.refresh();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Payment verification failed. Please contact support.";
            setError(msg);
            setIsProcessing(false);
          }
        },
        theme: {
          color: "#000000",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setError("Payment was not completed. Your order has not been confirmed.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description || "Payment failed");
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred initializing payment.";
      setError(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-none border border-destructive/20 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <Button
        onClick={handlePaymentRetry}
        disabled={isProcessing}
        className="w-full rounded-none h-12 text-sm font-medium tracking-wide uppercase"
        aria-live="polite"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Processing Payment
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </div>
  );
}
