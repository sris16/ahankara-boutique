import { headers } from "next/headers";
import Link from "next/link";
import { orderApi } from "@/lib/api/order";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, PackageX } from "lucide-react";
import { OrderStatus, FulfillmentStatus } from "@/types/order";

export const metadata = {
  title: "My Orders | AHANKARA STUDIOS",
  description: "View your order history.",
};

const getStatusDisplay = (status: OrderStatus, fulfillment: FulfillmentStatus) => {
  if (status === "CANCELLED") return { label: "Cancelled", style: "bg-destructive/10 text-destructive" };
  if (status === "EXPIRED") return { label: "Expired", style: "bg-muted text-muted-foreground" };

  if (fulfillment === "DELIVERED") return { label: "Delivered", style: "bg-green-500/10 text-green-700 dark:text-green-400" };
  if (fulfillment === "FULFILLED" || fulfillment === "PARTIALLY_FULFILLED")
    return { label: "In Transit", style: "bg-blue-500/10 text-blue-700 dark:text-blue-400" };

  if (status === "PENDING_PAYMENT") return { label: "Pending Payment", style: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };

  return { label: "Processing", style: "bg-foreground/10 text-foreground" };
};

export default async function OrdersPage() {
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get('cookie') ?? '';
  let data;

  try {
    data = await orderApi.getOrders(1, 20, { Cookie: cookieHeader });
  } catch (error) {
    console.error("Failed to load orders", error);
    return (
      <div className="py-12 text-center text-destructive">
        <p>Failed to load orders. Please try again later.</p>
      </div>
    );
  }

  if (data.orders.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center border rounded-sm bg-muted/5">
        <PackageX className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-serif text-2xl mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
        <Button asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-2xl hidden md:block">Order History</h2>

      <div className="flex flex-col gap-4">
        {data.orders.map((order) => {
          const status = getStatusDisplay(order.status, order.fulfillmentStatus);
          // Show up to 3 item images
          const previewItems = order.items?.slice(0, 3) || [];
          const remainingItemsCount = Math.max(0, (order.items?.length || 0) - 3);

          return (
            <div key={order.id} className="border rounded-sm overflow-hidden bg-card transition-shadow hover:shadow-sm">
              <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center justify-between border-b bg-muted/10">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                    <p className="font-medium font-mono text-sm">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="font-medium text-sm">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                  <span className={`px-2.5 py-1 rounded-sm text-xs font-medium tracking-wide ${status.style}`}>
                    {status.label}
                  </span>
                  <Button asChild variant="outline" size="sm" className="hidden md:flex">
                    <Link href={`/account/orders/${order.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>

              <Link href={`/account/orders/${order.id}`} className="block p-4 md:p-6 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {previewItems.map((item, idx) => (
                      <div key={idx} className="w-16 aspect-[3/4] bg-muted/20 rounded-sm overflow-hidden flex items-center justify-center relative border">
                        {/* We don't have images in the backend order item snapshot natively right now,
                            so we just show a generic placeholder or product name initial if image is unavailable.
                            The cart snapshot saves SKU and Name. We'll show an elegant initial fallback. */}
                        <span className="text-xs text-muted-foreground font-medium uppercase text-center p-1">
                          {item.productName.substring(0, 3)}
                        </span>
                      </div>
                    ))}
                    {remainingItemsCount > 0 && (
                      <div className="w-16 aspect-[3/4] rounded-sm bg-muted flex items-center justify-center border border-dashed">
                        <span className="text-xs font-medium text-muted-foreground">+{remainingItemsCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:hidden flex">
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
