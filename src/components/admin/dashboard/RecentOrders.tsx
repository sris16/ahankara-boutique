import { adminApi } from "@/lib/api/admin";
import { formatPrice, formatDate } from "@/lib/utils";
import { headers } from "next/headers";
import { PackageX } from "lucide-react";

export async function RecentOrders() {
  const reqHeaders = await headers();
  let orders = [];

  try {
    const res = await adminApi.getRecentOrders(5, reqHeaders) as any;
    orders = res.orders || [];
  } catch (error) {
    console.error("Failed to fetch recent orders:", error);
    return (
      <div className="bg-card border rounded-sm p-6 text-center text-muted-foreground">
        <PackageX className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Failed to load recent orders.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-card border rounded-sm p-6 text-center text-muted-foreground">
        <p>No recent orders yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/10">
        <h3 className="font-serif text-lg font-medium">Recent Orders</h3>
        <p className="text-xs text-muted-foreground mt-1">Showing {orders.length} latest orders</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/5 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order: { id: string, orderNumber: string, status: string, totalAmount: number, createdAt: string, user: { email?: string } }) => (
              <tr key={order.id} className="hover:bg-muted/5 transition-colors">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.user?.email || "Unknown"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-foreground/10 text-foreground text-[10px] rounded-sm uppercase font-medium">
                    {order.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.totalAmount)}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
