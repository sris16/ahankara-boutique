import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
import { CouponTable } from "@/components/admin/coupons/CouponTable";
import { Metadata } from "next";
import { Ticket } from "lucide-react";

export const metadata: Metadata = {
  title: "Coupons | AHANKARA STUDIOS Admin",
};

export default async function AdminCouponsPage() {
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") ?? "";

  const coupons = await adminApi.getCoupons({ Cookie: cookieHeader });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Ticket className="w-6 h-6 mr-2" />
            Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount codes and promotional pricing.
          </p>
        </div>
      </div>

      <CouponTable initialCoupons={coupons} />
    </div>
  );
}
