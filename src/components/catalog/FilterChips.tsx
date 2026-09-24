"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { CategoryTree, Collection } from "@/types/catalog";
import { formatPrice } from "@/lib/utils";

interface FilterChipsProps {
  categories: CategoryTree[];
  collections: Collection[];
}

export function FilterChips({ categories, collections }: FilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q");
  const categoryId = searchParams.get("category");
  const collectionSlug = searchParams.get("collection");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  // Determine if any filters are active
  if (!q && !categoryId && !collectionSlug && !minPrice && !maxPrice) {
    return null;
  }

  const removeFilter = (keysToRemove: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keysToRemove.forEach(key => params.delete(key));
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => {
    // Navigating directly to /products preserves nothing except the base route.
    router.push("/products");
  };

  const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name || "Unknown Category" : null;
  const collectionName = collectionSlug ? collections.find(c => c.slug === collectionSlug)?.name || "Unknown Collection" : null;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Active Filters:</span>

      {q && (
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-900 border border-brand-200 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors">
          Search: {q}
          <button onClick={() => removeFilter(["q"])} className="hover:text-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-full p-0.5" aria-label="Remove search filter">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {categoryName && (
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-900 border border-brand-200 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors">
          Category: {categoryName}
          <button onClick={() => removeFilter(["category"])} className="hover:text-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-full p-0.5" aria-label="Remove category filter">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {collectionName && (
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-900 border border-brand-200 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors">
          Collection: {collectionName}
          <button onClick={() => removeFilter(["collection"])} className="hover:text-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-full p-0.5" aria-label="Remove collection filter">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {minPrice && (
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-900 border border-brand-200 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors">
          Min: {formatPrice(parseInt(minPrice, 10))}
          <button onClick={() => removeFilter(["minPrice"])} className="hover:text-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-full p-0.5" aria-label="Remove minimum price filter">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {maxPrice && (
        <span className="inline-flex items-center gap-2 bg-brand-100 text-brand-900 border border-brand-200 text-xs font-medium px-3 py-1.5 rounded-sm transition-colors">
          Max: {formatPrice(parseInt(maxPrice, 10))}
          <button onClick={() => removeFilter(["maxPrice"])} className="hover:text-foreground focus:outline-none focus:ring-1 focus:ring-foreground rounded-full p-0.5" aria-label="Remove maximum price filter">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      <button
        onClick={clearAll}
        className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border-b border-transparent hover:border-foreground transition-all ml-2 focus:outline-none focus:ring-1 focus:ring-foreground p-0.5"
      >
        Clear All Filters
      </button>
    </div>
  );
}
