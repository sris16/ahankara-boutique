"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkoutApi } from "@/lib/api/checkout";
import { Order } from "@/types/checkout";
import { formatPrice } from "@/lib/utils";
import { Loader2, CheckCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        const data = await checkoutApi.getOrderById(resolvedParams.orderId);
        setOrder(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [resolvedParams.orderId, user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">{error || "We couldn't find the order you're looking for."}</p>
        <Button asChild size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mb-4">Thank you for your order!</h1>
        <p className="text-muted-foreground text-lg">
          Your order <strong className="text-foreground">{order.orderNumber}</strong> has been confirmed.
        </p>
        <p className="text-muted-foreground mt-2">
          We&apos;ll send you an email with shipping information when your order ships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-8">
          <div className="border rounded-sm p-6">
            <h2 className="text-lg font-medium uppercase tracking-wide mb-6 border-b pb-4">Order Details</h2>

            <div className="flex flex-col gap-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 aspect-[3/4] bg-muted/20 rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="font-medium text-lg">{item.productName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span> | Size: {item.size}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium mt-auto">{formatPrice(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-muted/10 border rounded-sm p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-4">Summary</h2>
            <div className="flex flex-col gap-3 text-sm mb-4 border-b pb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingAmount === 0 ? "Free" : formatPrice(order.shippingAmount)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-end">
              <span className="font-medium">Total</span>
              <span className="font-medium text-xl">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="border rounded-sm p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-4">Shipping Address</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">{order.shippingAddress.name}</strong><br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}<br />
              <span className="mt-2 block">{order.shippingAddress.phone}</span>
            </p>
          </div>

          <div className="border rounded-sm p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide mb-4">Payment Status</h2>
            <p className="text-sm font-medium">
              {order.paymentStatus === 'PAID' ? (
                <span className="text-green-600 dark:text-green-400">Paid successfully</span>
              ) : order.paymentStatus === 'PENDING' ? (
                <span className="text-amber-600 dark:text-amber-500">Payment pending</span>
              ) : (
                <span>{order.paymentStatus}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center border-t pt-8">
        <Button asChild variant="outline" size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
