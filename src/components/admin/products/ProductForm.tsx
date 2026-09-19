"use client";

import { useState } from "react";
import { AdminProduct, AdminCategory, AdminCollection } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductStatusBadge } from "./ProductStatusBadge";

interface ProductFormProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  collections: AdminCollection[];
}

export function ProductForm({ product, categories, collections }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const collectionIds = formData.getAll("collectionIds") as string[];

    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      shortDescription: formData.get("shortDescription") as string || null,
      description: formData.get("description") as string || null,
      basePrice: Math.round(parseFloat(formData.get("basePrice") as string) * 100), // convert to paise
      compareAtPrice: formData.get("compareAtPrice") ? Math.round(parseFloat(formData.get("compareAtPrice") as string) * 100) : null,
      categoryId: formData.get("categoryId") as string,
      isFeatured: formData.get("isFeatured") === "on",
      status: product ? product.status : "DRAFT", // new products are DRAFT
      metaTitle: formData.get("metaTitle") as string || null,
      metaDescription: formData.get("metaDescription") as string || null,
      collectionIds,
    };

    try {
      if (product) {
        await adminApi.updateProduct(product.id, data);
        setSuccess("Product updated successfully.");
        router.refresh();
      } else {
        const newProduct = await adminApi.createProduct(data);
        router.push(`/admin/products/${newProduct.id}`);
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (action: 'publish' | 'archive') => {
    if (!product) return;
    const confirmMsg = action === 'publish'
      ? 'Are you sure you want to publish this product to the storefront?'
      : 'Are you sure you want to archive this product? It will be hidden from the storefront.';

    if (!window.confirm(confirmMsg)) return;

    try {
      if (action === 'publish') await adminApi.publishProduct(product.id);
      else await adminApi.archiveProduct(product.id);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || `Failed to ${action} product`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {product && (
        <div className="flex items-center justify-between p-3 bg-muted/30 border rounded-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current Status:</span>
            <ProductStatusBadge status={product.status} />
          </div>
          <div className="flex gap-2">
            {product.status !== 'PUBLISHED' && (
              <Button type="button" size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange('publish')}>
                Publish Product
              </Button>
            )}
            {product.status !== 'ARCHIVED' && (
              <Button type="button" size="sm" variant="outline" className="text-muted-foreground hover:bg-muted" onClick={() => handleStatusChange('archive')}>
                Archive Product
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input id="slug" name="slug" defaultValue={product?.slug} required pattern="^[a-z0-9-]+$" title="Only lowercase letters, numbers, and hyphens" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price (₹) *</Label>
            <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue={product ? (product.basePrice / 100).toFixed(2) : ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtPrice">Compare-At Price (₹)</Label>
            <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            defaultValue={product?.shortDescription || ""}
            maxLength={255}
            className="flex min-h-[60px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description || ""}
            className="flex min-h-[120px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId || ""}
              required
              className="flex h-9 w-full rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Collections</Label>
            <div className="h-32 overflow-y-auto border rounded-sm p-2 bg-muted/10 space-y-1">
              {collections.map(c => {
                const isChecked = product?.collections?.some(pc => pc.collection.id === c.id);
                return (
                  <div key={c.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`col-${c.id}`}
                      name="collectionIds"
                      value={c.id}
                      defaultChecked={isChecked}
                      className="rounded-sm border-input"
                    />
                    <Label htmlFor={`col-${c.id}`} className="font-normal text-sm cursor-pointer">{c.name}</Label>
                  </div>
                );
              })}
              {collections.length === 0 && <p className="text-xs text-muted-foreground p-2">No collections available</p>}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">SEO Fields</h4>
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input id="metaTitle" name="metaTitle" defaultValue={product?.metaTitle || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              defaultValue={product?.metaDescription || ""}
              className="flex min-h-[60px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              defaultChecked={product ? product.isFeatured : false}
              className="w-4 h-4 rounded-sm border-input"
            />
            <Label htmlFor="isFeatured" className="font-medium">Feature this product</Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6 mt-1">Featured products can be highlighted on the storefront.</p>
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Saving..." : (product ? "Save Changes" : "Create Product")}
        </Button>
      </div>
    </form>
  );
}
