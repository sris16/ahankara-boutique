"use client";

import { AdminProduct, AdminCategory, AdminCollection } from "@/types/admin";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, Search, Edit2, Star, ImageIcon, Layers, Box } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

interface ProductTableProps {
  initialData: AdminProduct[];
  meta?: { total: number; page: number; limit: number; totalPages: number; };
  categories: AdminCategory[];
  collections: AdminCollection[];
}

export function ProductTable({ initialData, meta, categories, collections }: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const currentCategory = searchParams.get("category") || "";
  const currentCollection = searchParams.get("collection") || "";
  const currentStatus = searchParams.get("status") || "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Derived empty states
  const isFiltersActive = !!(searchParams.get("search") || searchParams.get("category") || searchParams.get("collection") || searchParams.get("status"));
  const hasProducts = initialData.length > 0;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-card border rounded-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, slug, or SKU..."
                aria-label="Search products"
                className="pl-9 bg-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          {/* Create Button */}
          <Link href="/admin/products/new" className="w-full lg:w-auto shrink-0">
            <Button className="w-full lg:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Select
            value={currentStatus}
            aria-label="Filter by status"
            onChange={e => handleFilter("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Select
            value={currentCategory}
            aria-label="Filter by category"
            onChange={e => handleFilter("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            value={currentCollection}
            aria-label="Filter by collection"
            onChange={e => handleFilter("collection", e.target.value)}
          >
            <option value="">All Collections</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main List Area */}
      {!hasProducts && !isFiltersActive ? (
        // Empty State: Zero products exist at all
        <div className="p-12 text-center bg-card border rounded-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Box className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">No Products Yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Get started by creating your first product to sell on the storefront.
          </p>
          <Link href="/admin/products/new">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </Link>
        </div>
      ) : !hasProducts && isFiltersActive ? (
        // Empty State: Zero search/filter matches
        <div className="p-12 text-center bg-card border rounded-sm text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground mb-1">No Products Found</p>
          <p className="text-sm">Try changing your search or filters.</p>
        </div>
      ) : (
        // Results List
        <div className="space-y-3">
          {initialData.map((product) => {
            const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];

            return (
              <div
                key={product.id}
                className="bg-card border rounded-sm p-4 hover:border-border/80 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 shrink-0 rounded-sm bg-muted overflow-hidden flex items-center justify-center border">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.secureUrl}
                      alt={`Thumbnail for ${product.name}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>

                {/* Primary Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-base truncate">{product.name}</h4>
                    <ProductStatusBadge status={product.status} />
                    {product.isFeatured && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-1.5 py-0 gap-1 bg-amber-100/50 text-amber-800 hover:bg-amber-100/50 border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">/{product.slug}</span>
                    <span className="text-foreground font-medium">₹{(product.basePrice / 100).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
                    {product.category && (
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{product.category.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Box className="w-3.5 h-3.5" />
                      <span>{product.variants?.length || 0} Variants</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                  <Link href={`/admin/products/${product.id}`}>
                    <Button variant="outline" size="sm" aria-label={`Edit ${product.name}`}>
                      <Edit2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4 pt-2">
          <div>
            Showing page <span className="font-medium text-foreground">{meta.page}</span> of {meta.totalPages} ({meta.total} total items)
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => handleFilter("page", (meta.page - 1).toString())}
              className="flex-1 sm:flex-none"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => handleFilter("page", (meta.page + 1).toString())}
              className="flex-1 sm:flex-none"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
