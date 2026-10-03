import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderService } from "@/server/services/order.service";
import { AuthService } from "@/server/services/auth.service";
import { UnauthorizedError, NotFoundError } from "@/utils/errors";
import { formatPrice, formatDate } from "@/lib/utils";
import { TrackingModule } from "@/components/orders/TrackingModule";
import { ChevronLeft, ShieldCheck, AlertTriangle, PackageOpen, RotateCcw, RefreshCw, IndianRupee } from "lucide-react";
import { OrderStatus, PaymentStatus, OrderItem } from "@/types/order";
import { CancelOrderDialog } from "@/components/orders/CancelOrderDialog";
import { ReturnItemDialog } from "@/components/orders/ReturnItemDialog";
import { ExchangeItemDialog } from "@/components/orders/ExchangeItemDialog";
import { OrderInvoiceDialog } from "@/components/orders/OrderInvoiceDialog";
import { OrderPaymentRetry } from "@/components/orders/OrderPaymentRetry";
import { PostPurchaseService } from "@/server/services/post-purchase.service";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return {
    title: `Order Details | AHANKARA STUDIOS`,
    description: `Details for order ${orderId}`,
    robots: { index: false, follow: false }
  };
}

const getOrderStatusBadgeVariant = (status: OrderStatus): "default" | "success" | "destructive" | "warning" => {
  if (status === "CANCELLED" || status === "EXPIRED") return "destructive";
  if (status === "DELIVERED") return "success";
  if (status === "SHIPPED") return "default";
  if (status === "PENDING_PAYMENT" || status === "PAYMENT_REVIEW") return "warning";
  return "default";
};

const getPaymentStatusBadgeVariant = (status: PaymentStatus): "default" | "success" | "destructive" | "warning" => {
  if (status === "PAID") return "success";
  if (status === "FAILED") return "destructive";
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return "warning";
  return "warning"; // PENDING
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const reqHeaders = await headers();

  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }

  let orderData;
  let trackingData = null;

  try {
    orderData = await OrderService.getCustomerOrderById(user.id, orderId);
    trackingData = await OrderService.getCustomerOrderTracking(user.id, orderId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  if (!orderData) notFound();

  const isCancellable =
    orderData.status !== 'CANCELLED' &&
    orderData.status !== 'EXPIRED' &&
    !['PARTIALLY_FULFILLED', 'FULFILLED', 'DELIVERED'].includes(orderData.fulfillmentStatus) &&
    !orderData.cancellation;

  // We fetch item eligibility server-side
  const itemEligibilities = new Map<string, number>();
  if (orderData.items) {
    await Promise.all(orderData.items.map(async (item) => {
      const eligibility = await PostPurchaseService.getItemEligibility(item.id);
      itemEligibilities.set(item.id, eligibility.remainingEligibleQuantity);
    }));
  }

  const isPaymentRetryEligible =
    orderData.status === 'PENDING_PAYMENT' &&
    orderData.paymentStatus === 'PENDING' &&
    Boolean(orderData.reservationExpiresAt && new Date(orderData.reservationExpiresAt) > new Date());

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Back to Orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="font-serif text-3xl tracking-tight">
                Order #{orderData.orderNumber}
              </h2>
              <Badge variant={getOrderStatusBadgeVariant(orderData.status as OrderStatus)} size="sm">
                {orderData.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant={getPaymentStatusBadgeVariant(orderData.paymentStatus as PaymentStatus)} size="sm">
                Payment: {orderData.paymentStatus.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Placed on {formatDate(orderData.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <OrderInvoiceDialog order={orderData} />
            {isCancellable && (
              <CancelOrderDialog orderId={orderId} />
            )}
          </div>
        </div>
      </div>

      {orderData.cancellation && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Cancellation {orderData.cancellation.status}</h4>
            <p className="text-xs mt-1">
              This order was cancelled by {orderData.cancellation.initiator.toLowerCase()} on {formatDate(orderData.cancellation.createdAt)}.
            </p>
            {orderData.cancellation.reason && (
              <p className="text-xs mt-1 font-medium">Reason: {orderData.cancellation.reason}</p>
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
                Curated Pieces Snapshot
              </h3>
              <span className="text-xs text-muted-foreground">
                {orderData.items?.length || 0} {orderData.items?.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="divide-y divide-border/40">
              {orderData.items?.map((item) => {
                const eligibleQty = itemEligibilities.get(item.id) || 0;
                return (
                  <div key={item.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                    <div className="flex gap-4 flex-1">
                      <div className="w-20 aspect-[3/4] bg-muted/20 rounded-sm border border-border/50 shrink-0 flex items-center justify-center">
                        <span className="text-xs font-mono font-medium text-muted-foreground uppercase">{item.productName.substring(0, 3)}</span>
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
                        <span className="font-medium text-sm mt-2">{formatPrice(item.lineTotal)}</span>
                      </div>
                      {eligibleQty > 0 && orderData.status === 'DELIVERED' && (
                        <div className="flex gap-2 w-full justify-end mt-2">
                          <ReturnItemDialog orderId={orderId} item={item as unknown as OrderItem} eligibleQuantity={eligibleQty} />
                          <ExchangeItemDialog orderId={orderId} item={item as unknown as OrderItem} eligibleQuantity={eligibleQty} />
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
              <TrackingModule
                trackingData={trackingData}
                orderStatus={orderData.status as OrderStatus}
                orderCreatedAt={orderData.createdAt}
              />
            </section>
          )}

          {/* Returns and Exchanges */}
          {((orderData.returnRequests?.length ?? 0) > 0 || (orderData.exchangeRequests?.length ?? 0) > 0) && (
            <section className="bg-background border border-border/50 rounded-none p-6">
              <h3 className="font-serif text-xl tracking-tight border-b border-border/40 pb-4 mb-4 flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-muted-foreground" />
                Returns & Exchanges
              </h3>
              <div className="space-y-4">
                {orderData.returnRequests?.map((req) => (
                  <div key={req.id} className="p-4 border border-border/60 rounded-sm bg-muted/5 flex items-start gap-4">
                    <RotateCcw className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">Return Request</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Requested on {formatDate(req.createdAt)}</p>
                        </div>
                        <Badge variant="outline" size="sm">
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {req.items?.map((returnItem) => (
                        <p key={returnItem.id} className="text-xs mt-2 text-muted-foreground">
                          {returnItem.quantity}x Item (Reason: {returnItem.reason ? returnItem.reason.replace(/_/g, " ") : "Not specified"})
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {orderData.exchangeRequests?.map((req) => (
                  <div key={req.id} className="p-4 border border-border/60 rounded-sm bg-muted/5 flex items-start gap-4">
                    <RefreshCw className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">Exchange Request</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Requested on {formatDate(req.createdAt)}</p>
                        </div>
                        <Badge variant="outline" size="sm">
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {req.items?.map((exchangeItem) => (
                        <p key={exchangeItem.id} className="text-xs mt-2 text-muted-foreground">
                          {exchangeItem.quantity}x exchanged for variant ID {exchangeItem.replacementVariantId}
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
            <div className="flex flex-col gap-3 text-sm mb-6 pb-6 border-b border-border/40">
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
                <span>{orderData.shippingAmount === 0 ? "Complimentary" : formatPrice(orderData.shippingAmount)}</span>
              </div>
              {orderData.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes (Included)</span>
                  <span>{formatPrice(orderData.taxAmount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-end mb-6">
              <span className="font-medium text-base">Total</span>
              <span className="font-medium text-2xl tracking-tight font-serif">{formatPrice(orderData.totalAmount)}</span>
            </div>

            {orderData.paymentStatus === "PAID" && (
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-500/10 p-3 rounded-none border border-green-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Payment authorized & verified
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
            <section className="bg-background border border-border/50 rounded-none p-6">
              <h3 className="font-serif text-xl tracking-tight flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
                <IndianRupee className="w-5 h-5 text-muted-foreground" />
                Refunds
              </h3>
              <div className="space-y-3">
                {orderData.refunds?.map((refund) => (
                  <div key={refund.id} className="flex justify-between items-center text-sm p-3 border border-border/50 rounded-sm">
                    <div>
                      <p className="font-medium">{formatPrice(refund.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(refund.createdAt)}</p>
                    </div>
                    <Badge
                      variant={refund.status === 'SUCCEEDED' ? 'success' : refund.status === 'FAILED' ? 'destructive' : 'warning'}
                      size="sm"
                    >
                      {refund.status}
                    </Badge>
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
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm mb-2">{orderData.shippingAddress.name}</p>
                <p>{orderData.shippingAddress.line1}</p>
                {orderData.shippingAddress.line2 && <p>{orderData.shippingAddress.line2}</p>}
                <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.postalCode}</p>
                <p>{orderData.shippingAddress.country}</p>
                <p className="pt-2 text-foreground font-medium">Phone: {orderData.shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No shipping address recorded.</p>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
