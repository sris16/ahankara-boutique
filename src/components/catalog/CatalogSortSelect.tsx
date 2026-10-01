"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "name", label: "Alphabetical (A–Z)" },
] as const;

interface CatalogSortSelectProps {
  currentSort?: string;
  className?: string;
}

export function CatalogSortSelect({ currentSort, className }: CatalogSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSort = currentSort || searchParams.get("sort") || "newest";

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== "newest") {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <label htmlFor="catalog-sort" className="sr-only">
        Sort Products
      </label>
      <div className="relative flex items-center">
        <select
          id="catalog-sort"
          value={activeSort}
          onChange={(e) => handleSortChange(e.target.value)}
          aria-label="Sort products"
          className="appearance-none bg-surface/80 hover:bg-surface border border-border/70 hover:border-border text-foreground text-xs uppercase tracking-widest pl-3.5 pr-8 py-2.5 rounded-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-background text-foreground py-1 normal-case tracking-normal">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-muted-foreground transition-transform"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
