"use client";

import { useState } from "react";
import { AdminProduct, AdminCategory, AdminCollection } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Save, CheckCircle2, Box, Link as LinkIcon, Info, Image as ImageIcon, IndianRupee } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";

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

  // Status update state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<'publish' | 'archive' | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Controlled states for auto-slug
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!product);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManuallyEdited(true);
  };

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
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChangeClick = (action: 'publish' | 'archive') => {
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!product || !statusAction) return;
    setIsStatusUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      if (statusAction === 'publish') await adminApi.publishProduct(product.id);
      else await adminApi.archiveProduct(product.id);
      setIsStatusDialogOpen(false);
      setStatusAction(null);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || `Failed to ${statusAction} product. Operation failed.`);
      setIsStatusDialogOpen(false);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Notifications */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-sm">Failed to save product</h4>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm font-medium pt-0.5">{success}</p>
        </div>
      )}

      {/* Top Bar for Existing Products */}
      {product && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border rounded-sm gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <ProductStatusBadge status={product.status} />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {product.status !== 'PUBLISHED' && (
              <Button type="button" size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 flex-1 sm:flex-none" onClick={() => handleStatusChangeClick('publish')}>
                Publish Product
              </Button>
            )}
            {product.status !== 'ARCHIVED' && (
              <Button type="button" size="sm" variant="outline" className="text-muted-foreground hover:bg-muted flex-1 sm:flex-none" onClick={() => handleStatusChangeClick('archive')}>
                Archive Product
              </Button>
            )}
          </div>
        </div>
      )}

      {/* A. Basic Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Box className="w-4 h-4" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border p-6 rounded-sm">
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="name" className="text-base font-medium">Product Name *</Label>
            <Input id="name" name="name" value={name} onChange={handleNameChange} required className="h-11" placeholder="e.g. Summer Floral Dress" />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="slug" className="text-base font-medium flex justify-between">
              URL Slug *
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={handleSlugChange}
                required
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens"
                className="pl-9 h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
              <Info className="w-3.5 h-3.5" />
              {isSlugManuallyEdited ? "Custom slug in use" : "Auto-generated from name"}
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              name="shortDescription"
              defaultValue={product?.shortDescription || ""}
              maxLength={255}
              placeholder="Brief summary for catalog cards (max 255 chars)"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description || ""}
              placeholder="Detailed product information, materials, and care instructions."
              className="min-h-[160px]"
            />
          </div>
        </div>
      </section>

      {/* B. Classification */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Classification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border p-6 rounded-sm">
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="font-medium">Primary Category *</Label>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId || ""}
              required
            >
              <option value="" disabled>Select a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">Determines primary catalog placement.</p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <Label className="font-medium">Collections</Label>
            <p className="text-xs text-muted-foreground mb-3">Include product in thematic collections.</p>
            <div className="h-48 overflow-y-auto border rounded-sm p-3 bg-muted/10 space-y-2">
              {collections.map(c => {
                const isChecked = product?.collections?.some(pc => pc.collection.id === c.id);
                return (
                  <label key={c.id} className="flex items-start space-x-3 cursor-pointer p-1.5 hover:bg-muted/30 rounded-sm transition-colors">
                    <div className="pt-0.5">
                      <Checkbox
                        name="collectionIds"
                        value={c.id}
                        defaultChecked={isChecked}
                      />
                    </div>
                    <span className="font-normal text-sm leading-none">{c.name}</span>
                  </label>
                );
              })}
              {collections.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No collections available.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* C. Pricing / Product Configuration */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          Pricing Baseline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border p-6 rounded-sm">
          <div className="space-y-2">
            <Label htmlFor="basePrice" className="font-medium">Base Price (₹) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product ? (product.basePrice / 100).toFixed(2) : ""}
                required
                className="pl-8 h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground">Default price if variants do not override.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compareAtPrice" className="font-medium">Compare-At Price (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""}
                className="pl-8 h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground">Used to show a discount (e.g., strikethrough price).</p>
          </div>
        </div>
      </section>

      {/* D & E. Publishing & SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Visibility */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Visibility
          </h3>
          <div className="bg-card border p-6 rounded-sm h-full">
            <div className="flex items-start space-x-3 p-3 bg-amber-50/50 border border-amber-100 rounded-sm">
              <div className="pt-0.5">
                <Checkbox
                  id="isFeatured"
                  name="isFeatured"
                  defaultChecked={product ? product.isFeatured : false}
                />
              </div>
              <div>
                <Label htmlFor="isFeatured" className="font-medium cursor-pointer text-amber-900">Featured Product</Label>
                <p className="text-xs text-amber-700/80 mt-1">Highlight this product in prominent storefront carousels and promotional sections.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Search Engine Optimization
          </h3>
          <div className="bg-card border p-6 rounded-sm space-y-4 h-full">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">SEO Title</Label>
              <Input id="metaTitle" name="metaTitle" defaultValue={product?.metaTitle || ""} placeholder="Custom title for search engines" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">SEO Description</Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                defaultValue={product?.metaDescription || ""}
                placeholder="Meta description (ideally 150-160 characters)"
                className="min-h-[80px]"
              />
            </div>
          </div>
        </section>

      </div>

      <div className="pt-8 border-t flex justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-sm shadow-sm">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {!isSubmitting && <Save className="w-4 h-4 mr-2" />}
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>

    <ConfirmDialog
      isOpen={isStatusDialogOpen}
      onOpenChange={setIsStatusDialogOpen}
      title={statusAction === 'publish' ? "Publish Product" : "Archive Product"}
      description={statusAction === 'publish'
        ? "Are you sure you want to publish this product to the storefront?"
        : "Are you sure you want to archive this product? It will be hidden from the storefront."}
      confirmText={statusAction === 'publish' ? "Yes, Publish" : "Yes, Archive"}
      onConfirm={handleConfirmStatusChange}
      isLoading={isStatusUpdating}
      isDestructive={statusAction === 'archive'}
    />
    </>
  );
}
