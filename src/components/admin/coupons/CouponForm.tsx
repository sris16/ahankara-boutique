"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCouponDetail, CreateCouponInput, UpdateCouponInput, CouponType } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CouponFormProps {
  initialData?: AdminCouponDetail;
  couponId?: string;
}

export function CouponForm({ initialData, couponId }: CouponFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert paise to rupees for display
  const toRupees = (paise?: number | null) => (paise ? (paise / 100).toString() : "");

  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "PERCENTAGE" as CouponType,
    value: initialData?.type === "FIXED_AMOUNT" 
      ? toRupees(initialData.value) 
      : initialData?.value?.toString() || "",
    minimumOrderAmount: toRupees(initialData?.minimumOrderAmount) || "0",
    maximumDiscountAmount: toRupees(initialData?.maximumDiscountAmount),
    usageLimit: initialData?.usageLimit?.toString() || "",
    usageLimitPerUser: initialData?.usageLimitPerUser?.toString() || "",
    isActive: initialData !== undefined ? initialData.isActive : true,
    startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : "",
    endsAt: initialData?.endsAt ? new Date(initialData.endsAt).toISOString().slice(0, 16) : "",
    // Restrictions
    productIds: initialData?.products?.map((p) => p.productId).join(", ") || "",
    categoryIds: initialData?.categories?.map((c) => c.categoryId).join(", ") || "",
    collectionIds: initialData?.collections?.map((c) => c.collectionId).join(", ") || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare payload
      const valueNumber = parseFloat(formData.value);
      const finalValue = formData.type === "FIXED_AMOUNT" ? Math.round(valueNumber * 100) : valueNumber;

      const payload: CreateCouponInput | UpdateCouponInput = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: finalValue,
        minimumOrderAmount: formData.minimumOrderAmount ? Math.round(parseFloat(formData.minimumOrderAmount) * 100) : 0,
        maximumDiscountAmount: formData.maximumDiscountAmount ? Math.round(parseFloat(formData.maximumDiscountAmount) * 100) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
        isActive: formData.isActive,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        // Basic split for IDs. In a real app with existing MultiSelects we would use array state directly
        productIds: formData.productIds ? formData.productIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        categoryIds: formData.categoryIds ? formData.categoryIds.split(",").map(s => s.trim()).filter(Boolean) : [],
        collectionIds: formData.collectionIds ? formData.collectionIds.split(",").map(s => s.trim()).filter(Boolean) : [],
      };

      if (couponId) {
        await adminApi.updateCoupon(couponId, payload);
      } else {
        await adminApi.createCoupon(payload as CreateCouponInput);
      }

      router.push("/admin/coupons");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!couponId) return;
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      const res = await adminApi.deleteCoupon(couponId);
      if (res.message) {
        alert(res.message); // Inform the user if it was soft-deactivated vs deleted
      }
      router.push("/admin/coupons");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-6 sm:space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {initialData ? "Edit Coupon" : "New Coupon"}
          </h3>
          <p className="max-w-2xl text-sm text-gray-500 mt-1">
            Coupons are applied securely on the backend. Customer restrictions are evaluated based on cart contents.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-6 sm:space-y-5">
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Coupon Code *
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="code"
                id="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Internal Name *
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Description
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="max-w-lg shadow-sm block w-full focus:ring-black focus:border-black sm:text-sm border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Discount Type *
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Discount Value *
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2 relative max-w-xs rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {formData.type === "FIXED_AMOUNT" ? "₹" : ""}
                </span>
              </div>
              <input
                type="number"
                name="value"
                id="value"
                required
                min="0"
                step={formData.type === "PERCENTAGE" ? "1" : "0.01"}
                max={formData.type === "PERCENTAGE" ? "100" : undefined}
                value={formData.value}
                onChange={handleChange}
                className={cn(
                  "block w-full focus:ring-black focus:border-black sm:text-sm border-gray-300 rounded-md",
                  formData.type === "FIXED_AMOUNT" ? "pl-7" : "",
                  formData.type === "PERCENTAGE" ? "pr-8" : ""
                )}
              />
              {formData.type === "PERCENTAGE" && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              )}
            </div>
          </div>

          {/* Limits */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="minimumOrderAmount" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Minimum Order Amount (₹)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="number"
                name="minimumOrderAmount"
                id="minimumOrderAmount"
                min="0"
                step="0.01"
                value={formData.minimumOrderAmount}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {formData.type === "PERCENTAGE" && (
            <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
              <label htmlFor="maximumDiscountAmount" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
                Maximum Discount (₹)
              </label>
              <div className="mt-1 sm:mt-0 sm:col-span-2">
                <input
                  type="number"
                  name="maximumDiscountAmount"
                  id="maximumDiscountAmount"
                  min="0"
                  step="0.01"
                  value={formData.maximumDiscountAmount}
                  onChange={handleChange}
                  className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Global Usage Limit
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="number"
                name="usageLimit"
                id="usageLimit"
                min="1"
                step="1"
                value={formData.usageLimit}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="usageLimitPerUser" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Per-User Limit
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="number"
                name="usageLimitPerUser"
                id="usageLimitPerUser"
                min="1"
                step="1"
                value={formData.usageLimitPerUser}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="startsAt" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Start Date
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="datetime-local"
                name="startsAt"
                id="startsAt"
                value={formData.startsAt}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="endsAt" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              End Date
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="datetime-local"
                name="endsAt"
                id="endsAt"
                value={formData.endsAt}
                onChange={handleChange}
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Active Status
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <div className="flex items-center h-5">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="focus:ring-black h-4 w-4 text-black border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Restrictions (Simple CSV input for IDs for now, per plan) */}
          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="productIds" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Product Restrictions (CSV of UUIDs)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="productIds"
                id="productIds"
                value={formData.productIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Category Restrictions (CSV of UUIDs)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="categoryIds"
                id="categoryIds"
                value={formData.categoryIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
            <label htmlFor="collectionIds" className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2">
              Collection Restrictions (CSV of UUIDs)
            </label>
            <div className="mt-1 sm:mt-0 sm:col-span-2">
              <input
                type="text"
                name="collectionIds"
                id="collectionIds"
                value={formData.collectionIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
                className="max-w-lg block w-full shadow-sm focus:ring-black focus:border-black sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-between">
          <div>
            {couponId && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
                Delete Coupon
              </button>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
