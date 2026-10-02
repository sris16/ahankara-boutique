"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCouponDetail, CreateCouponInput, UpdateCouponInput, CouponType } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CouponFormProps {
  initialData?: AdminCouponDetail;
  couponId?: string;
}

export function CouponForm({ initialData, couponId }: CouponFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setIsDeleting(true);
    setError(null);
    try {
      const res = await adminApi.deleteCoupon(couponId);
      if (res.message) {
        alert(res.message);
      }
      setIsDeleteDialogOpen(false);
      router.push("/admin/coupons");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-serif text-foreground">
            {initialData ? "Edit Coupon" : "New Coupon"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Coupons are evaluated securely during checkout. Ensure limits and restrictions are set correctly.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-sm border border-destructive/20 bg-destructive/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>The core identification properties of the coupon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="code">Coupon Code <span className="text-destructive">*</span></Label>
              <Input
                id="code"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                placeholder="SUMMER25"
                className="uppercase"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Internal Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Summer Sale 2026"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional internal notes about this promotion..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Discount Configuration</CardTitle>
            <CardDescription>Determine how the discount affects the cart total.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="type">Discount Type <span className="text-destructive">*</span></Label>
                <Select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">Discount Value <span className="text-destructive">*</span></Label>
                <div className="relative">
                  {formData.type === "FIXED_AMOUNT" && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">₹</span>
                    </div>
                  )}
                  <Input
                    type="number"
                    id="value"
                    name="value"
                    required
                    min="0"
                    step={formData.type === "PERCENTAGE" ? "1" : "0.01"}
                    max={formData.type === "PERCENTAGE" ? "100" : undefined}
                    value={formData.value}
                    onChange={handleChange}
                    className={cn(
                      formData.type === "FIXED_AMOUNT" ? "pl-7" : "",
                      formData.type === "PERCENTAGE" ? "pr-8" : ""
                    )}
                  />
                  {formData.type === "PERCENTAGE" && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="minimumOrderAmount">Minimum Order Amount (₹)</Label>
                <Input
                  type="number"
                  id="minimumOrderAmount"
                  name="minimumOrderAmount"
                  min="0"
                  step="0.01"
                  value={formData.minimumOrderAmount}
                  onChange={handleChange}
                />
              </div>

              {formData.type === "PERCENTAGE" && (
                <div className="grid gap-2">
                  <Label htmlFor="maximumDiscountAmount">Maximum Discount (₹)</Label>
                  <Input
                    type="number"
                    id="maximumDiscountAmount"
                    name="maximumDiscountAmount"
                    min="0"
                    step="0.01"
                    value={formData.maximumDiscountAmount}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Limits & Validity</CardTitle>
            <CardDescription>Control when and how often this coupon can be redeemed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Global Usage Limit</Label>
                <Input
                  type="number"
                  id="usageLimit"
                  name="usageLimit"
                  min="1"
                  step="1"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  placeholder="Unlimited"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usageLimitPerUser">Per-User Limit</Label>
                <Input
                  type="number"
                  id="usageLimitPerUser"
                  name="usageLimitPerUser"
                  min="1"
                  step="1"
                  value={formData.usageLimitPerUser}
                  onChange={handleChange}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  type="datetime-local"
                  id="startsAt"
                  name="startsAt"
                  value={formData.startsAt}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">End Date</Label>
                <Input
                  type="datetime-local"
                  id="endsAt"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <Checkbox
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive" className="text-sm font-medium leading-none cursor-pointer">
                Coupon is Active
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Restrictions</CardTitle>
            <CardDescription>Limit application to specific products, categories, or collections via UUIDs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="productIds">Product Restrictions (CSV of UUIDs)</Label>
              <Input
                type="text"
                id="productIds"
                name="productIds"
                value={formData.productIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryIds">Category Restrictions (CSV of UUIDs)</Label>
              <Input
                type="text"
                id="categoryIds"
                name="categoryIds"
                value={formData.categoryIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="collectionIds">Collection Restrictions (CSV of UUIDs)</Label>
              <Input
                type="text"
                id="collectionIds"
                name="collectionIds"
                value={formData.collectionIds}
                onChange={handleChange}
                placeholder="uuid-1, uuid-2"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-4 border-t border-border">
          <div>
            {couponId && (
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || isSubmitting}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Coupon
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || isDeleting}
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isDeleting}>
              {initialData ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </div>
      </form>

      {/* Deletion AlertDialog replacement using generic Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone and will prevent customers from redeeming it immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isDeleting}>
              Yes, Delete Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
