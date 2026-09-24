import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderService } from "@/server/services/order.service";
import { AuthService } from "@/server/services/auth.service";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, PackageX } from "lucide-react";
import { OrderStatus, FulfillmentStatus } from "@/types/order";

export const metadata = {
  title: "My Orders | AHANKARA STUDIOS",
  description: "View your order history.",
  robots: { index: false, follow: false }
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
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch (error) {
    redirect("/login");
  }

  let data;
  try {
    data = await OrderService.getCustomerOrders(user.id, 1, 20);
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
      <div className="py-24 flex flex-col items-center justify-center text-center border border-border/50 rounded-sm bg-background">
        <PackageX className="w-12 h-12 text-muted-foreground/50 mb-6" />
        <h2 className="font-serif text-2xl tracking-tight mb-3 text-foreground">No orders yet</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Explore the latest AHANKARA STUDIOS collection.
        </p>
        <Button asChild className="rounded-none px-8">
          <Link href="/products">Explore Collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="font-serif text-3xl tracking-tight hidden md:block">Order History</h2>

      <div className="flex flex-col gap-6">
        {data.orders.map((order) => {
          const status = getStatusDisplay(order.status as OrderStatus, order.fulfillmentStatus as FulfillmentStatus);
          // Show up to 3 item images
          const previewItems = order.items?.slice(0, 3) || [];
          const remainingItemsCount = Math.max(0, (order.items?.length || 0) - 3);

          return (
            <div key={order.id} className="border border-border/60 rounded-none overflow-hidden bg-background transition-colors hover:border-foreground/20">
              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-5 md:items-center justify-between border-b border-border/40">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Order Number</p>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Date</p>
                    <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Total</p>
                    <p className="font-medium text-sm tracking-tight">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
                  <span className={`px-3 py-1 text-[10px] font-medium tracking-widest uppercase border ${status.style.replace('bg-', 'bg-transparent text-').replace('/10', '')} ${status.style.includes('foreground') ? 'border-border' : 'border-current/20'}`}>
                    {status.label}
                  </span>
                  <Button asChild variant="link" size="sm" className="hidden md:flex p-0 h-auto font-medium hover:no-underline hover:text-muted-foreground transition-colors">
                    <Link href={`/account/orders/${order.id}`}>
                      View Order
                    </Link>
                  </Button>
                </div>
              </div>

              <Link href={`/account/orders/${order.id}`} className="block p-5 md:p-6 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {previewItems.map((item, idx) => (
                      <div key={idx} className="w-16 aspect-[3/4] bg-muted/10 overflow-hidden flex items-center justify-center relative border border-border/50">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase text-center p-1 tracking-widest">
                          {item.productName.substring(0, 3)}
                        </span>
                      </div>
                    ))}
                    {remainingItemsCount > 0 && (
                      <div className="w-16 aspect-[3/4] bg-transparent flex items-center justify-center border border-border/50">
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
