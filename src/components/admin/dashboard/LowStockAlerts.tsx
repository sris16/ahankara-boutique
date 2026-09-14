import { adminApi } from "@/lib/api/admin";
import { headers } from "next/headers";
import { AlertCircle } from "lucide-react";

export async function LowStockAlerts() {
  const reqHeaders = await headers();
  let lowStockItems = [];

  try {
    const res = await adminApi.getLowStockAlerts(reqHeaders);
    lowStockItems = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Failed to fetch low stock alerts:", error);
    return (
      <div className="bg-card border rounded-sm p-6 text-center text-muted-foreground">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Failed to load low stock alerts.</p>
      </div>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-card border rounded-sm p-6 text-center text-muted-foreground">
        <p>No low-stock items right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/10">
        <h3 className="font-serif text-lg font-medium text-destructive">Low Stock Alerts</h3>
        <p className="text-xs text-muted-foreground mt-1">Variants requiring immediate attention</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/5 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium text-right">Available Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {lowStockItems.map((item: any) => (
              <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                <td className="px-4 py-3 font-medium">{item.productId}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  SKU: {item.sku}<br/>
                  {item.size} {item.color ? `| ${item.color}` : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center justify-center bg-destructive/10 text-destructive font-bold px-2 py-1 rounded-sm min-w-[2rem]">
                    {item.quantity - item.reservedQuantity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
