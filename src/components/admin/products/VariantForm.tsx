"use client";

import { useState } from "react";
import { AdminVariant } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle } from "lucide-react";

interface VariantFormProps {
  productId: string;
  variant: AdminVariant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantForm({ productId, variant, onClose, onSuccess }: VariantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      sku: formData.get("sku") as string,
      size: formData.get("size") as string || null,
      color: formData.get("color") as string || null,
      price: formData.get("price") ? Math.round(parseFloat(formData.get("price") as string) * 100) : null,
      compareAtPrice: formData.get("compareAtPrice") ? Math.round(parseFloat(formData.get("compareAtPrice") as string) * 100) : null,
      weightInGrams: formData.get("weightInGrams") ? parseFloat(formData.get("weightInGrams") as string) : null,
      lengthCm: formData.get("lengthCm") ? parseFloat(formData.get("lengthCm") as string) : null,
      breadthCm: formData.get("breadthCm") ? parseFloat(formData.get("breadthCm") as string) : null,
      heightCm: formData.get("heightCm") ? parseFloat(formData.get("heightCm") as string) : null,
      isActive: formData.get("isActive") === "on",
    };

    try {
      if (variant) {
        await adminApi.updateVariant(productId, variant.id, data);
      } else {
        await adminApi.createVariant(productId, data);
      }
      onSuccess();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An unexpected error occurred. E.g. SKU must be unique.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border shadow-xl rounded-sm w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-serif font-medium">
            {variant ? `Edit Variant: ${variant.sku}` : "New Variant"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Identifiers</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" defaultValue={variant?.sku} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input id="size" name="size" defaultValue={variant?.size || ""} placeholder="e.g. M, L, XL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" defaultValue={variant?.color || ""} placeholder="e.g. Red, Blue" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">The combination of Size and Color must be unique for this product.</p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Pricing (Overrides base price)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={variant?.price !== null && variant?.price !== undefined ? (variant.price / 100).toFixed(2) : ""} placeholder="Leave blank to use base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare-At Price (₹)</Label>
                <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={variant?.compareAtPrice !== null && variant?.compareAtPrice !== undefined ? (variant.compareAtPrice / 100).toFixed(2) : ""} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Shipping Dimensions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weightInGrams">Weight (g)</Label>
                <Input id="weightInGrams" name="weightInGrams" type="number" step="0.1" min="0" defaultValue={variant?.weightInGrams ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lengthCm">Length (cm)</Label>
                <Input id="lengthCm" name="lengthCm" type="number" step="0.1" min="0" defaultValue={variant?.lengthCm ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breadthCm">Breadth (cm)</Label>
                <Input id="breadthCm" name="breadthCm" type="number" step="0.1" min="0" defaultValue={variant?.breadthCm ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heightCm">Height (cm)</Label>
                <Input id="heightCm" name="heightCm" type="number" step="0.1" min="0" defaultValue={variant?.heightCm ?? ""} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={variant ? variant.isActive : true}
                className="w-4 h-4 rounded-sm border-input"
              />
              <Label htmlFor="isActive" className="font-medium">Active Variant</Label>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Variant"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
