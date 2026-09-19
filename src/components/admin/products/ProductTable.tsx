/* eslint-disable @next/next/no-img-element */
"use client";

import { AdminProduct, AdminCategory } from "@/types/admin";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit2, Star, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface ProductTableProps {
  initialData: AdminProduct[];
  meta?: { total: number; page: number; limit: number; totalPages: number; };
  categories: AdminCategory[];
}

export function ProductTable({ initialData, meta, categories }: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set("search", searchTerm);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products..."
              aria-label="Search products"
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="flex h-9 w-full sm:w-36 rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchParams.get("status") || ""}
            aria-label="Filter by status"
            onChange={e => handleFilter("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            className="flex h-9 w-full sm:w-48 rounded-sm border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={searchParams.get("category") || ""}
            aria-label="Filter by category"
            onChange={e => handleFilter("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <Link href="/admin/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card border rounded-sm overflow-hidden">
        {initialData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No products found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Variants</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialData.map((product) => {
                  const primaryImage = product.images?.find(i => i.isPrimary) || product.images?.[0];

                  return (
                    <tr key={product.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-sm border flex items-center justify-center overflow-hidden shrink-0">
                            {primaryImage ? (
                              <img src={primaryImage.secureUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{product.name}</span>
                              {product.isFeatured && <span title="Featured"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /></span>}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">/{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatusBadge status={product.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{(product.basePrice / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {product.variants?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="sm" aria-label={`Edit ${product.name}`}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total items)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => handleFilter("page", (meta.page - 1).toString())}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => handleFilter("page", (meta.page + 1).toString())}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
