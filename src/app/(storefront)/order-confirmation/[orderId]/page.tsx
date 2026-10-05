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
  const [error, setError] = useState<{ message: string; is404: boolean } | null>(null);

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
        const is404 = (err as { statusCode?: number })?.statusCode === 404;
        const msg = err instanceof Error ? err.message : "Failed to load order details";
        setError({ message: msg, is404 });
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
    if (error && !error.is404) {
      return (
        <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <h1 className="font-serif text-3xl mb-4">Unable to Load Order</h1>
          <p className="text-muted-foreground mb-8">
            {error.message || "We encountered a temporary network or server issue."}
          </p>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} size="lg" variant="default">
              Try Again
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/account/orders">My Orders</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center min-h-[50vh]">
        <h1 className="font-serif text-3xl mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">
          {error?.message || "We couldn't find the order you're looking for."}
        </p>
        <Button asChild size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 max-w-4xl">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 border border-success/20">
          <CheckCircle className="w-8 h-8 stroke-[1.5]" />
        </div>
        <span className="text-xs uppercase tracking-[0.25em] text-accent font-mono font-medium block mb-2">
          Atelier Acquisition Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-3">
          Thank you for your order
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Creation Reference: <strong className="text-foreground font-mono">{order.orderNumber}</strong>
        </p>
        <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-md mx-auto">
          We have reserved your pieces. A detailed dispatch itinerary and tracking dossier will be sent to your registered email.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-8">
          <div className="bg-surface border border-border/70 rounded-xs p-6 sm:p-7 shadow-subtle">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 border-b border-border/40 pb-4 text-foreground">
              Curated Selections
            </h2>

            <div className="flex flex-col divide-y divide-border/40">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative w-16 sm:w-20 aspect-[3/4] bg-surface-muted rounded-xs overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
                    <Package className="w-6 h-6 text-muted-foreground/40 stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <p className="font-serif text-sm sm:text-base font-medium text-foreground">{item.productName}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        {item.color && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-surface-muted text-[11px] font-mono tracking-wide uppercase">
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-surface-muted text-[11px] font-mono tracking-wide uppercase font-medium">
                            {item.size}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground/70">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-mono tabular-nums font-medium text-foreground mt-2">{formatPrice(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border/70 rounded-xs p-6 shadow-subtle">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-4 pb-2 border-b border-border/40">
              Summary
            </h2>
            <div className="flex flex-col gap-3 text-sm mb-4 border-b border-border/50 pb-4">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-foreground">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-accent">
                  <span>Privilege</span>
                  <span className="font-mono tabular-nums font-medium">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Dispatch</span>
                <span className="text-xs uppercase tracking-wider text-success font-medium font-mono">
                  {order.shippingAmount === 0 ? "Complimentary" : formatPrice(order.shippingAmount)}
                </span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>GST</span>
                  <span className="font-mono tabular-nums text-foreground text-xs">{formatPrice(order.taxAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Total</span>
              <span className="font-mono tabular-nums font-medium text-xl text-foreground">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          <div className="bg-surface border border-border/70 rounded-xs p-6 shadow-subtle">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-3 pb-2 border-b border-border/40">
              Destination Address
            </h2>
            <address className="text-xs text-muted-foreground leading-relaxed not-italic space-y-0.5">
              <strong className="text-foreground block font-medium text-sm mb-1">{order.shippingAddress.name}</strong>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} <span className="font-mono">{order.shippingAddress.postalCode}</span></p>
              <p className="uppercase tracking-wider text-[10px] text-muted-foreground/80">{order.shippingAddress.country}</p>
              <p className="mt-2 font-mono text-foreground pt-1 border-t border-border/30">{order.shippingAddress.phone}</p>
            </address>
          </div>

          <div className="bg-surface border border-border/70 rounded-xs p-6 shadow-subtle">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground mb-3 pb-2 border-b border-border/40">
              Payment Status
            </h2>
            <p className="text-xs font-medium font-mono uppercase tracking-wider">
              {order.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Paid successfully
                </span>
              ) : order.paymentStatus === 'PENDING' ? (
                <span className="inline-flex items-center gap-1.5 text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Verification in progress
                </span>
              ) : (
                <span className="text-muted-foreground">{order.paymentStatus}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center border-t border-border/50 pt-8">
        <Button asChild variant="outline" size="lg" className="uppercase tracking-[0.2em] text-xs h-12 px-8 rounded-xs">
          <Link href="/products">Continue Exploring</Link>
        </Button>
      </div>
    </div>
  );
}
