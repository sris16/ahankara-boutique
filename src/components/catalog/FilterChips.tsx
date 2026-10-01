"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, RotateCcw } from "lucide-react";
import { CategoryTree, Collection } from "@/types/catalog";
import { formatPrice } from "@/lib/utils";

interface FilterChipsProps {
  categories: CategoryTree[];
  collections: Collection[];
  className?: string;
}

export function FilterChips({ categories, collections, className }: FilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q");
  const categoryId = searchParams.get("category");
  const collectionSlug = searchParams.get("collection");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  // Determine if any filters are active
  const hasFilters = Boolean(q || categoryId || collectionSlug || minPrice || maxPrice);
  if (!hasFilters) {
    return null;
  }

  const removeFilter = (keysToRemove: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keysToRemove.forEach((key) => params.delete(key));
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    router.push("/products", { scroll: false });
  };

  const categoryName = categoryId
    ? categories.find((c) => c.id === categoryId)?.name || "Category"
    : null;
  const collectionName = collectionSlug
    ? collections.find((c) => c.slug === collectionSlug)?.name || "Collection"
    : null;

  return (
    <div
      role="region"
      aria-label="Active Filters"
      className={`flex flex-wrap items-center gap-2 mb-6 pt-1 ${className || ""}`}
    >
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground mr-1 select-none font-medium">
        Filtered By:
      </span>

      {q && (
        <span className="inline-flex items-center gap-1.5 bg-surface/90 hover:bg-surface text-foreground border border-border/80 text-xs px-3 py-1 rounded-xs transition-colors shadow-2xs">
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Search:</span>
          <span className="font-medium truncate max-w-[140px]">{q}</span>
          <button
            type="button"
            onClick={() => removeFilter(["q"])}
            className="hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full p-0.5 ml-0.5 cursor-pointer"
            aria-label={`Remove search filter ${q}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {categoryName && (
        <span className="inline-flex items-center gap-1.5 bg-surface/90 hover:bg-surface text-foreground border border-border/80 text-xs px-3 py-1 rounded-xs transition-colors shadow-2xs">
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Category:</span>
          <span className="font-medium">{categoryName}</span>
          <button
            type="button"
            onClick={() => removeFilter(["category"])}
            className="hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full p-0.5 ml-0.5 cursor-pointer"
            aria-label={`Remove category filter ${categoryName}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {collectionName && (
        <span className="inline-flex items-center gap-1.5 bg-surface/90 hover:bg-surface text-foreground border border-border/80 text-xs px-3 py-1 rounded-xs transition-colors shadow-2xs">
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Collection:</span>
          <span className="font-medium">{collectionName}</span>
          <button
            type="button"
            onClick={() => removeFilter(["collection"])}
            className="hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full p-0.5 ml-0.5 cursor-pointer"
            aria-label={`Remove collection filter ${collectionName}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1.5 bg-surface/90 hover:bg-surface text-foreground border border-border/80 text-xs px-3 py-1 rounded-xs transition-colors shadow-2xs">
          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Price:</span>
          <span className="font-medium tabular-nums">
            {minPrice ? formatPrice(parseInt(minPrice, 10)) : "₹0"}
            {" — "}
            {maxPrice ? formatPrice(parseInt(maxPrice, 10)) : "Above"}
          </span>
          <button
            type="button"
            onClick={() => removeFilter(["minPrice", "maxPrice"])}
            className="hover:text-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-full p-0.5 ml-0.5 cursor-pointer"
            aria-label="Remove price filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={clearAll}
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors ml-2 cursor-pointer py-1 px-1.5"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Reset</span>
      </button>
    </div>
  );
}
