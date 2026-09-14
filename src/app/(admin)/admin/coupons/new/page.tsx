import { Metadata } from "next";
import { CouponForm } from "@/components/admin/coupons/CouponForm";
import { Ticket } from "lucide-react";

export const metadata: Metadata = {
  title: "New Coupon | AHANKARA STUDIOS Admin",
};

export default function NewCouponPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center">
        <Ticket className="w-6 h-6 mr-2 text-gray-500" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Create New Coupon
        </h1>
      </div>

      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <CouponForm />
      </div>
    </div>
  );
}
