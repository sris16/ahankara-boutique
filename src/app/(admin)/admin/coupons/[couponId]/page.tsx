import { Metadata } from "next";
import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
import { CouponForm } from "@/components/admin/coupons/CouponForm";
import { notFound } from "next/navigation";
import { Ticket, History } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit Coupon | AHANKARA STUDIOS Admin",
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ couponId: string }>;
}) {
  const resolvedParams = await params;
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") ?? "";

  try {
    const coupon = await adminApi.getCouponById(resolvedParams.couponId, {
      Cookie: cookieHeader,
    });

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center">
          <Ticket className="w-6 h-6 mr-2 text-gray-500" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Edit Coupon: {coupon.code}
          </h1>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <CouponForm initialData={coupon} couponId={coupon.id} />
        </div>

        {coupon.redemptions && coupon.redemptions.length > 0 && (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex items-center border-b border-gray-200">
              <History className="w-5 h-5 mr-2 text-gray-500" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Redemptions
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {coupon.redemptions.map((redemption) => (
                <li key={redemption.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Order ID: {redemption.orderId}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Saved {formatPrice(redemption.discountAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        User ID: {redemption.userId}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {new Date(redemption.redeemedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Failed to load coupon:", error);
    notFound();
  }
}
