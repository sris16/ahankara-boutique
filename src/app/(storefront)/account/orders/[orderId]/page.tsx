import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderService } from "@/server/services/order.service";
import { AuthService } from "@/server/services/auth.service";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrackingModule } from "@/components/orders/TrackingModule";
import { ChevronLeft, MapPin, Receipt, ShieldCheck, AlertTriangle, PackageOpen, RotateCcw, RefreshCw, IndianRupee } from "lucide-react";
import { OrderStatus, PaymentStatus } from "@/types/order";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { ReturnItemDialog } from "@/components/orders/ReturnItemDialog";
import { ExchangeItemDialog } from "@/components/orders/ExchangeItemDialog";
import { OrderPaymentRetry } from "@/components/orders/OrderPaymentRetry";
import { PostPurchaseService } from "@/server/services/post-purchase.service";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return {
    title: `Order Details | AHANKARA STUDIOS`,
    description: `Details for order ${orderId}`,
    robots: { index: false, follow: false }
  };
}

const getOrderStatusColor = (status: OrderStatus) => {
  if (status === "CANCELLED" || status === "EXPIRED") return "bg-muted text-muted-foreground";
  if (status === "DELIVERED") return "bg-green-500/10 text-green-700 dark:text-green-400";
  if (status === "SHIPPED") return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
  return "bg-foreground/10 text-foreground";
};

const getPaymentStatusColor = (status: PaymentStatus) => {
  if (status === "PAID") return "bg-green-500/10 text-green-700 dark:text-green-400";
  if (status === "FAILED") return "bg-destructive/10 text-destructive";
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "bg-amber-500/10 text-amber-700 dark:text-amber-400"; // PENDING
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const reqHeaders = await headers();

  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch (error) {
    redirect("/login");
  }

  let orderData;
  let trackingData = null;

  try {
    orderData = await OrderService.getCustomerOrderById(user.id, orderId);
  } catch (error) {
    notFound();
  }

  if (!orderData) notFound();

  const isCancellable =
    orderData.status !== 'CANCELLED' &&
    orderData.status !== 'EXPIRED' &&
    !['PARTIALLY_FULFILLED', 'FULFILLED', 'DELIVERED'].includes(orderData.fulfillmentStatus) &&
    !orderData.cancellation;

  // We only fetch item eligibility if the order might be eligible for return/exchange (e.g. DELIVERED)
  // Or simply fetch for all items to be safe, it's server-side so it's fast.
  const itemEligibilities = new Map<string, number>();
  if (orderData.items) {
    await Promise.all(orderData.items.map(async (item) => {
      try {
        const eligibility = await PostPurchaseService.getItemEligibility(item.id);
        itemEligibilities.set(item.id, eligibility.remainingEligibleQuantity);
      } catch (e) {
        itemEligibilities.set(item.id, 0);
      }
    }));
  }

  const isPaymentRetryEligible =
    orderData.status === 'PENDING_PAYMENT' &&
    orderData.paymentStatus === 'PENDING' &&
    new Date(orderData.reservationExpiresAt!) > new Date();

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-serif text-3xl tracking-tight mb-2 flex items-center gap-3">
              Order {orderData.orderNumber}
            </h2>
            <p className="text-muted-foreground text-sm">
              Placed on {formatDate(orderData.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isCancellable && (
              <CancelOrderDialog orderId={orderId} />
            )}
            <span className={`px-3 py-1 text-[10px] font-medium tracking-widest uppercase border ${getOrderStatusColor(orderData.status as OrderStatus).replace('bg-', 'bg-transparent text-').replace('/10', '')} border-current/20`}>
              {orderData.status.replace(/_/g, " ")}
            </span>
            <span className={`px-3 py-1 text-[10px] font-medium tracking-widest uppercase border ${getPaymentStatusColor(orderData.paymentStatus as PaymentStatus).replace('bg-', 'bg-transparent text-').replace('/10', '')} border-current/20`}>
              {orderData.paymentStatus.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {orderData.cancellation && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium">Cancellation {orderData.cancellation.status}</h4>
            <p className="text-sm mt-1">
              This order was cancelled by {orderData.cancellation.initiator.toLowerCase()} on {formatDate(orderData.cancellation.createdAt)}.
            </p>
            {orderData.cancellation.reason && (
              <p className="text-sm mt-1 font-medium">Reason: {orderData.cancellation.reason}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Items & Totals */}
        <div className="lg:col-span-2 space-y-8">

          {/* Items Section */}
          <section className="bg-background border border-border/50 rounded-none overflow-hidden">
            <div className="p-5 md:p-6 border-b border-border/40 flex justify-between items-center">
              <h3 className="font-serif text-xl tracking-tight flex items-center gap-2">
                Items Snapshot
              </h3>
            </div>
            <div className="divide-y divide-border/40">
              {orderData.items?.map((item) => {
                const eligibleQty = itemEligibilities.get(item.id) || 0;
                return (
                  <div key={item.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className="w-20 aspect-[3/4] bg-muted/20 rounded-sm border shrink-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground uppercase">{item.productName.substring(0, 3)}</span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-medium text-sm md:text-base truncate">{item.productName}</p>
                        <div className="text-xs md:text-sm text-muted-foreground mt-1 flex gap-2">
                          {item.color && <span>{item.color}</span>}
                          {item.color && item.size && <span>|</span>}
                          {item.size && <span>{item.size}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                          SKU: {item.sku}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col justify-between items-start md:items-end gap-4 md:gap-0 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="flex flex-col items-start md:items-end w-full">
                        <span className="font-medium text-sm md:text-base">{formatPrice(item.unitPrice)}</span>
                        <span className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</span>
                        <span className="font-medium text-sm mt-3">{formatPrice(item.lineTotal)}</span>
                      </div>
                      {eligibleQty > 0 && orderData.status === 'DELIVERED' && (
                        <div className="flex gap-2 w-full justify-end">
                          <ReturnItemDialog orderId={orderId} item={item as any} eligibleQuantity={eligibleQty} />
                          <ExchangeItemDialog orderId={orderId} item={item as any} eligibleQuantity={eligibleQty} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tracking Module */}
          {trackingData && (
            <section>
              <TrackingModule trackingData={trackingData} />
            </section>
          )}

          {/* Returns and Exchanges */}
          {((orderData.returnRequests?.length ?? 0) > 0 || (orderData.exchangeRequests?.length ?? 0) > 0) && (
            <section className="bg-card border rounded-sm p-6">
              <h3 className="font-serif text-lg border-b pb-4 mb-4 flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-muted-foreground" />
                Returns & Exchanges
              </h3>
              <div className="space-y-4">
                {orderData.returnRequests?.map((req: any) => (
                  <div key={req.id} className="p-4 border rounded-sm bg-muted/5 flex items-start gap-4">
                    <RotateCcw className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Return Request</p>
                          <p className="text-xs text-muted-foreground mt-1">Requested on {formatDate(req.createdAt)}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium uppercase bg-foreground/10 rounded-sm">
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {req.items?.map((item: any) => (
                        <p key={item.id} className="text-sm mt-2 text-muted-foreground">
                          {item.quantity}x Item (Reason: {item.reason.replace(/_/g, " ")})
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {orderData.exchangeRequests?.map((req: any) => (
                  <div key={req.id} className="p-4 border rounded-sm bg-muted/5 flex items-start gap-4">
                    <RefreshCw className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Exchange Request</p>
                          <p className="text-xs text-muted-foreground mt-1">Requested on {formatDate(req.createdAt)}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium uppercase bg-foreground/10 rounded-sm">
                          {req.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {req.items?.map((item: any) => (
                        <p key={item.id} className="text-sm mt-2 text-muted-foreground">
                          {item.quantity}x exchanged for {item.replacementVariantId}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Right Column: Summary & Address */}
        <div className="space-y-8">

          {/* Payment Summary */}
          <section className="bg-background border border-border/50 rounded-none p-6">
            <h3 className="font-serif text-xl tracking-tight border-b border-border/40 pb-4 mb-4">Payment Summary</h3>
            <div className="flex flex-col gap-3 text-sm mb-6 pb-6 border-b">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(orderData.subtotal)}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount {orderData.couponCode ? `(${orderData.couponCode})` : ""}</span>
                  <span>-{formatPrice(orderData.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{orderData.shippingAmount === 0 ? "Free" : formatPrice(orderData.shippingAmount)}</span>
              </div>
              {orderData.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>{formatPrice(orderData.taxAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-end mb-6">
              <span className="font-medium text-lg">Total</span>
              <span className="font-medium text-2xl tracking-tight">{formatPrice(orderData.totalAmount)}</span>
            </div>

            {orderData.paymentStatus === "PAID" && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-500/10 p-3 rounded-none border border-green-500/20">
                <ShieldCheck className="w-4 h-4" />
                Payment verified and secured
              </div>
            )}

            {isPaymentRetryEligible && (
              <div className="mt-6 pt-6 border-t border-border/40">
                <OrderPaymentRetry orderId={orderId} />
              </div>
            )}
          </section>

          {/* Refunds */}
          {(orderData.refunds?.length ?? 0) > 0 && (
            <section className="bg-card border rounded-sm p-6">
              <h3 className="font-serif text-lg flex items-center gap-2 border-b pb-4 mb-4">
                <IndianRupee className="w-5 h-5 text-muted-foreground" />
                Refunds
              </h3>
              <div className="space-y-3">
                {orderData.refunds?.map((refund: any) => (
                  <div key={refund.id} className="flex justify-between items-center text-sm p-3 border rounded-sm">
                    <div>
                      <p className="font-medium">{formatPrice(refund.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(refund.createdAt)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium uppercase rounded-sm ${
                      refund.status === 'SUCCEEDED' ? 'bg-green-500/10 text-green-700' :
                      refund.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                      'bg-amber-500/10 text-amber-700'
                    }`}>
                      {refund.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shipping Address */}
          <section className="bg-background border border-border/50 rounded-none p-6">
            <h3 className="font-serif text-xl tracking-tight border-b border-border/40 pb-4 mb-4">
              Delivery Address
            </h3>
            {orderData.shippingAddress ? (
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground mb-2">{orderData.shippingAddress.name}</p>
                <p>{orderData.shippingAddress.line1}</p>
                {orderData.shippingAddress.line2 && <p>{orderData.shippingAddress.line2}</p>}
                <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.postalCode}</p>
                <p>{orderData.shippingAddress.country}</p>
                <p className="pt-2">Phone: {orderData.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No shipping address recorded.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
