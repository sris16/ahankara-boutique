import { InventoryService } from "@/server/services/inventory.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { LowStockVariant } from "@/types/admin";

export async function LowStockAlerts() {
  const reqHeaders = await headers();
  let lowStockItems: LowStockVariant[] = [];

  try {
    // 1. Authorize explicitly at component level to preserve API-like security boundary
    await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

    // 2. Direct Service Invocation instead of adminApi (HTTP)
    const res = await InventoryService.getLowStockVariants();
    lowStockItems = Array.isArray(res) ? (res as unknown as LowStockVariant[]) : [];
  } catch (error) {
    console.error("Failed to fetch low stock alerts:", error);
    return (
      <Card className="shadow-sm border-destructive/20">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
          <AlertCircle className="w-8 h-8 mb-4 text-destructive opacity-50" />
          <p className="text-destructive text-sm">Failed to load low stock alerts.</p>
        </CardContent>
      </Card>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg font-serif">Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <AlertCircle className="w-8 h-8 mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No low-stock items right now.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-full flex flex-col border-destructive/20">
      <CardHeader className="bg-destructive/5 border-b border-destructive/10 p-4 sm:p-5 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-serif text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Low Stock Alerts
          </CardTitle>
          <p className="text-xs text-destructive/80 mt-1">Variants requiring immediate attention</p>
        </div>
        <Badge variant="destructive" className="px-2.5 py-0.5 rounded-full">
          {lowStockItems.length}
        </Badge>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border">
          {lowStockItems.map((item) => {
            const availableQuantity = item.quantity - item.reservedQuantity;
            const isCritical = availableQuantity <= 0;

            return (
              <div key={item.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="sm:w-1/2">
                      <Link
                        href={`/admin/products/${item.productId}`}
                        className="font-semibold text-foreground hover:underline truncate text-sm"
                        title={item.productId}
                      >
                        Product ID: {item.productId.split('-')[0]}...
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate" title={item.sku}>
                        SKU: {item.sku}
                      </p>
                    </div>

                    <div className="sm:w-1/2">
                      <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                        {item.size && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-muted text-muted-foreground">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-muted text-muted-foreground">
                            Color: {item.color}
                          </span>
                        )}
                        {!item.size && !item.color && (
                          <span className="text-xs text-muted-foreground italic">Default Variant</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:w-1/4">
                    <div className="flex flex-col items-start sm:items-end">
                      <Badge variant={isCritical ? 'destructive' : 'warning'} className="text-[10px] uppercase">
                        {isCritical ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: <span className={`font-semibold ${isCritical ? 'text-destructive' : 'text-warning'}`}>{availableQuantity}</span>
                      </p>
                    </div>

                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                      aria-label={`View product ${item.productId}`}
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
