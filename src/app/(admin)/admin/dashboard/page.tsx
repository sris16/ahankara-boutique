import { Suspense } from "react";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";
import { LowStockAlerts } from "@/components/admin/dashboard/LowStockAlerts";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Dashboard | AHANKARA STUDIOS",
  description: "Admin operational dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Operational summary for AHANKARA STUDIOS</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={
          <div className="bg-card border rounded-sm p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        }>
          <RecentOrders />
        </Suspense>

        <Suspense fallback={
          <div className="bg-card border rounded-sm p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        }>
          <LowStockAlerts />
        </Suspense>
      </div>
    </div>
  );
}
