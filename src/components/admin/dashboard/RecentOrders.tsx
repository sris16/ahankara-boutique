import { OrderService } from "@/server/services/order.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { headers } from "next/headers";
import { PackageX, ShoppingBag, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import Link from "next/link";

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  user: {
    email: string | null;
  } | null;
}

function getStatusConfig(status: string): { variant: BadgeProps['variant'], label: string } {
  switch (status) {
    case 'CONFIRMED':
    case 'DELIVERED':
      return { variant: 'success', label: status };
    case 'PENDING_PAYMENT':
    case 'PAYMENT_REVIEW':
      return { variant: 'warning', label: status.replace('_', ' ') };
    case 'PROCESSING':
      return { variant: 'secondary', label: 'PROCESSING' };
    case 'SHIPPED':
      return { variant: 'outline', label: 'SHIPPED' };
    case 'CANCELLED':
    case 'EXPIRED':
      return { variant: 'destructive', label: status };
    default:
      return { variant: 'outline', label: status.replace(/_/g, ' ') };
  }
}

export async function RecentOrders() {
  const reqHeaders = await headers();
  let orders: RecentOrder[] = [];

  try {
    // 1. Authorize explicitly at component level to preserve API-like security boundary
    await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

    // 2. Direct Service Invocation instead of adminApi (HTTP)
    const res = await OrderService.getAllOrders(1, 5);
    orders = (res.orders || []) as unknown as RecentOrder[];
  } catch (error) {
    console.error("Failed to fetch recent orders:", error);
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <PackageX className="w-8 h-8 mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">Failed to load recent orders.</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg font-serif">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <ShoppingBag className="w-8 h-8 mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No recent orders yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="bg-muted/10 border-b p-4 sm:p-5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-serif">Recent Orders</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Showing {orders.length} latest orders</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);

            return (
              <div key={order.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex justify-between sm:justify-start items-center sm:w-1/3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-foreground hover:underline truncate"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </Link>
                      <Badge variant={statusConfig.variant} className="sm:hidden text-[10px]">
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <div className="sm:w-1/3">
                      <p className="text-sm font-medium truncate" title={order.user?.email || 'Guest'}>
                        {order.user?.email || 'Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="hidden sm:flex sm:w-1/3 justify-end pr-4">
                      <Badge variant={statusConfig.variant} className="text-[10px]">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:w-1/5">
                    <span className="font-semibold text-foreground">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                      aria-label={`View order ${order.orderNumber}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
