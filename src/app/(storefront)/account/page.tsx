import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthService } from "@/server/services/auth.service";
import { OrderService } from "@/server/services/order.service";
import { AddressService } from "@/server/services/address.service";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  MapPin,
  Heart,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { OrderStatus, FulfillmentStatus } from "@/types/order";

export const metadata = {
  title: "Atelier Client Overview | AHANKARA STUDIOS",
  description: "Personal concierge, recent orders, and wardrobe preferences.",
  robots: { index: false, follow: false },
};

const getStatusBadge = (status: OrderStatus, fulfillment: FulfillmentStatus) => {
  if (status === "CANCELLED") return <Badge variant="destructive">Cancelled</Badge>;
  if (fulfillment === "DELIVERED") return <Badge variant="default" className="bg-green-600/90 text-white">Delivered</Badge>;
  if (fulfillment === "FULFILLED" || fulfillment === "PARTIALLY_FULFILLED")
    return <Badge variant="secondary" className="bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-500/20">In Transit</Badge>;
  if (status === "PENDING_PAYMENT") return <Badge variant="outline" className="text-amber-600 border-amber-500/30">Pending</Badge>;
  return <Badge variant="outline">Processing</Badge>;
};

export default async function AccountRootPage() {
  const reqHeaders = await headers();
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch {
    redirect("/login?callbackUrl=/account");
  }

  // Safely fetch dashboard highlights
  type OrderSummary = Awaited<ReturnType<typeof OrderService.getCustomerOrders>>["orders"][number];
  let recentOrders: OrderSummary[] = [];
  let totalOrdersCount = 0;
  try {
    const ordersData = await OrderService.getCustomerOrders(user.id, 1, 2);
    recentOrders = ordersData.orders;
    totalOrdersCount = ordersData.pagination.total;
  } catch (err) {
    console.error("Dashboard failed to load recent orders", err);
  }

  type UserAddress = Awaited<ReturnType<typeof AddressService.getUserAddresses>>[number];
  let addresses: UserAddress[] = [];
  try {
    addresses = await AddressService.getUserAddresses(user.id);
  } catch (err) {
    console.error("Dashboard failed to load addresses", err);
  }

  const defaultShipping = addresses.find((a) => a.isDefaultShipping) || addresses[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Overview Header */}
      <div>
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-mono block mb-1">
          CLIENT CONCIERGE & DASHBOARD
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
          Wardrobe Overview
        </h2>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="bg-background border border-border/80 rounded-xs p-5 hover:border-foreground/40 transition-colors shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
              Total Orders
            </span>
            <Package className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
              {totalOrdersCount}
            </span>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground flex items-center gap-1">
              View History <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="bg-background border border-border/80 rounded-xs p-5 hover:border-foreground/40 transition-colors shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
              Saved Addresses
            </span>
            <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
              {addresses.length}
            </span>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>

        <Link
          href="/wishlist"
          className="bg-background border border-border/80 rounded-xs p-5 hover:border-foreground/40 transition-colors shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-muted-foreground">
              Saved Pieces
            </span>
            <Heart className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
              Curated
            </span>
            <span className="text-[11px] text-muted-foreground group-hover:text-foreground flex items-center gap-1">
              Explore <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-background border border-border/80 rounded-xs p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
          <div>
            <h3 className="font-serif text-lg tracking-tight text-foreground">Recent Acquisitions</h3>
            <p className="text-xs text-muted-foreground font-mono">Your latest bespoke couture orders</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xs text-xs uppercase tracking-wider h-9">
            <Link href="/account/orders">All Orders</Link>
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface-muted/60 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <p className="font-serif text-base text-foreground mb-1">No orders yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mb-4">
              Explore the latest AHANKARA STUDIOS runway and ready-to-wear collections.
            </p>
            <Button asChild className="rounded-xs text-xs uppercase tracking-widest px-6 h-10">
              <Link href="/products">Explore Boutique</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recentOrders.map((order) => (
              <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status as OrderStatus, order.fulfillmentStatus as FulfillmentStatus)}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} pieces
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Button asChild variant="ghost" size="sm" className="rounded-xs text-xs uppercase tracking-wider h-8">
                    <Link href={`/account/orders/${order.id}`}>
                      View Details →
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Primary Address & Atelier Concierge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Shipping Address Card */}
        <div className="bg-background border border-border/80 rounded-xs p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground">
                PRIMARY SHIPPING ADDRESS
              </span>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>

            {defaultShipping ? (
              <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground text-sm">{defaultShipping.fullName}</p>
                <p>{defaultShipping.addressLine1}</p>
                {defaultShipping.addressLine2 && <p>{defaultShipping.addressLine2}</p>}
                <p>
                  {defaultShipping.city}, {defaultShipping.state} {defaultShipping.postalCode}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/80 pt-1">
                  Contact: {defaultShipping.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have not designated a primary shipping address yet.
              </p>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-border/60">
            <Button asChild variant="outline" size="sm" className="w-full rounded-xs text-xs uppercase tracking-widest h-9">
              <Link href="/account/addresses">
                {defaultShipping ? "Manage Addresses" : "Add Shipping Address"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Concierge Care Tile */}
        <div className="bg-surface-muted/40 border border-border/80 rounded-xs p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-accent">
                ATELIER CONCIERGE
              </span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>

            <h4 className="font-serif text-base text-foreground mb-2">
              Private Styling & Assistance
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Need alterations, sizing consultations, or tracking an international bespoke shipment? Our private client advisors are available.
            </p>

            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Complimentary insured shipping on all orders</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border/60">
            <Button asChild variant="outline" size="sm" className="w-full rounded-xs text-xs uppercase tracking-widest h-9">
              <Link href="/account/profile">
                Client Profile & Security <ExternalLink className="w-3 h-3 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

