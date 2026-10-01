import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderService } from "@/server/services/order.service";
import { AuthService } from "@/server/services/auth.service";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronRight, PackageX, ExternalLink } from "lucide-react";
import { OrderStatus, FulfillmentStatus } from "@/types/order";

export const metadata = {
  title: "My Orders | AHANKARA STUDIOS",
  description: "View and track your order history.",
  robots: { index: false, follow: false }
};

const getStatusBadge = (status: OrderStatus, fulfillment: FulfillmentStatus) => {
  if (status === "CANCELLED") return { label: "Cancelled", variant: "destructive" as const };
  if (status === "EXPIRED") return { label: "Expired", variant: "outline" as const };
  if (fulfillment === "DELIVERED") return { label: "Delivered", variant: "success" as const };
  if (fulfillment === "FULFILLED" || fulfillment === "PARTIALLY_FULFILLED")
    return { label: "In Transit", variant: "default" as const };
  if (status === "PENDING_PAYMENT") return { label: "Pending Payment", variant: "warning" as const };
  return { label: "Processing", variant: "secondary" as const };
};

export default async function OrdersPage() {
  const reqHeaders = await headers();
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch {
    redirect("/login");
  }

  let data;
  try {
    data = await OrderService.getCustomerOrders(user.id, 1, 20);
  } catch (error) {
    console.error("Failed to load orders", error);
    return (
      <div className="py-12 text-center text-destructive">
        <p>Failed to load orders. Please refresh or try again later.</p>
      </div>
    );
  }

  if (data.orders.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={PackageX}
          title="No orders yet"
          description="Your curated order history is empty. Explore our latest collections and bespoke garments."
          action={{
            label: "Explore Collection",
            href: "/products",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl tracking-tight">Order History</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Review recent acquisitions, track consignment shipments, and manage returns.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {data.orders.map((order) => {
          const status = getStatusBadge(order.status as OrderStatus, order.fulfillmentStatus as FulfillmentStatus);
          const previewItems = order.items?.slice(0, 3) || [];
          const remainingItemsCount = Math.max(0, (order.items?.length || 0) - 3);

          return (
            <div
              key={order.id}
              className="border border-border/60 rounded-none overflow-hidden bg-background transition-all hover:border-foreground/30 shadow-subtle"
            >
              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-5 md:items-center justify-between border-b border-border/40 bg-surface/40">
                <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-8">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Order Ref</p>
                    <p className="font-medium text-xs sm:text-sm font-mono">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                    <p className="text-xs sm:text-sm text-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total</p>
                    <p className="font-medium text-xs sm:text-sm tracking-tight">{formatPrice(order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Items</p>
                    <p className="text-xs sm:text-sm text-foreground">{order.items?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                  <Badge variant={status.variant} size="sm">
                    {status.label}
                  </Badge>
                  <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex text-xs uppercase tracking-wider gap-1.5">
                    <Link href={`/account/orders/${order.id}`}>
                      View Details
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              <Link
                href={`/account/orders/${order.id}`}
                className="block p-5 md:p-6 group cursor-pointer hover:bg-surface/30 transition-colors"
                aria-label={`View order ${order.orderNumber}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {previewItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="w-16 aspect-[3/4] bg-muted/20 overflow-hidden flex items-center justify-center relative border border-border/50 rounded-xs"
                      >
                        <span className="text-[10px] text-muted-foreground font-mono font-medium uppercase text-center p-1 tracking-widest">
                          {item.productName.substring(0, 3)}
                        </span>
                      </div>
                    ))}
                    {remainingItemsCount > 0 && (
                      <div className="w-16 aspect-[3/4] bg-muted/10 flex items-center justify-center border border-border/50 rounded-xs">
                        <span className="text-xs font-medium text-muted-foreground">+{remainingItemsCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground group-hover:text-foreground font-medium transition-colors gap-1">
                    <span className="hidden sm:inline">Inspect Order</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
