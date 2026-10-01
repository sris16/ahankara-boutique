"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw } from "lucide-react";
import { CategoryTree, Collection } from "@/types/catalog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MobileFilterDrawer } from "./MobileFilterDrawer";

interface CatalogFiltersProps {
  categories: CategoryTree[];
  collections: Collection[];
  initialParams: {
    q?: string;
    category?: string;
    collection?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  className?: string;
}

const PRICE_PRESETS = [
  { label: "Under ₹5,000", min: undefined, max: 500000 },
  { label: "₹5,000 — ₹15,000", min: 500000, max: 1500000 },
  { label: "₹15,000 — ₹30,000", min: 1500000, max: 3000000 },
  { label: "₹30,000 & Above", min: 3000000, max: undefined },
] as const;

export function CatalogFilters({
  categories,
  collections,
  initialParams,
  className,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = React.useState(initialParams.q || "");

  const [minPriceInput, setMinPriceInput] = React.useState(
    initialParams.minPrice ? Math.floor(Number(initialParams.minPrice) / 100).toString() : ""
  );
  const [maxPriceInput, setMaxPriceInput] = React.useState(
    initialParams.maxPrice ? Math.floor(Number(initialParams.maxPrice) / 100).toString() : ""
  );
  const [priceError, setPriceError] = React.useState("");

  // Accordion state
  const [openSections, setOpenSections] = React.useState({
    search: true,
    categories: true,
    collections: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilters = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("q", searchQuery.trim() || undefined);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const current = searchParams.get("category");
    updateFilters("category", current === categoryId ? undefined : categoryId);
  };

  const handleCollectionToggle = (collectionSlug: string) => {
    const current = searchParams.get("collection");
    updateFilters("collection", current === collectionSlug ? undefined : collectionSlug);
  };

  const handlePricePreset = (min?: number, max?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min !== undefined) {
      params.set("minPrice", min.toString());
    } else {
      params.delete("minPrice");
    }
    if (max !== undefined) {
      params.set("maxPrice", max.toString());
    } else {
      params.delete("maxPrice");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleCustomPriceApply = () => {
    setPriceError("");
    const minRs = minPriceInput ? parseInt(minPriceInput, 10) : NaN;
    const maxRs = maxPriceInput ? parseInt(maxPriceInput, 10) : NaN;

    if (!isNaN(minRs) && !isNaN(maxRs) && minRs > maxRs) {
      setPriceError("Min price cannot exceed max price");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (!isNaN(minRs) && minRs >= 0) {
      params.set("minPrice", (minRs * 100).toString());
    } else {
      params.delete("minPrice");
    }

    if (!isNaN(maxRs) && maxRs >= 0) {
      params.set("maxPrice", (maxRs * 100).toString());
    } else {
      params.delete("maxPrice");
    }

    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const activeCategory = searchParams.get("category");
  const activeCollection = searchParams.get("collection");
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");
  const activeQuery = searchParams.get("q");

  // Count active filters
  let activeFilterCount = 0;
  if (activeCategory) activeFilterCount++;
  if (activeCollection) activeFilterCount++;
  if (activeMinPrice || activeMaxPrice) activeFilterCount++;
  if (activeQuery) activeFilterCount++;

  const renderFilterBody = () => (
    <div className="space-y-7">
      {/* 1. Keyword Search */}
      <div className="border-b border-border/50 pb-6">
        <button
          type="button"
          onClick={() => toggleSection("search")}
          className="flex items-center justify-between w-full text-left font-serif text-sm tracking-wider uppercase text-foreground mb-3 cursor-pointer group"
          aria-expanded={openSections.search}
        >
          <span className="group-hover:text-accent transition-colors">Search Pieces</span>
          {openSections.search ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {openSections.search && (
          <form onSubmit={handleSearchSubmit} className="relative mt-2">
            <label htmlFor="catalog-search-input" className="sr-only">
              Search by title or style
            </label>
            <Input
              id="catalog-search-input"
              type="text"
              placeholder="e.g. Saree, Kurta, Silk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 text-xs bg-surface/40 h-9"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </form>
        )}
      </div>

      {/* 2. Categories */}
      {categories.length > 0 && (
        <div className="border-b border-border/50 pb-6">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full text-left font-serif text-sm tracking-wider uppercase text-foreground mb-3 cursor-pointer group"
            aria-expanded={openSections.categories}
          >
            <span className="group-hover:text-accent transition-colors">Category</span>
            {openSections.categories ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          {openSections.categories && (
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateFilters("category", undefined)}
                className={cn(
                  "flex items-center gap-2.5 w-full text-left py-1 text-xs transition-colors cursor-pointer group",
                  !activeCategory ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                    !activeCategory ? "border-accent bg-accent/15" : "border-border/80 group-hover:border-border"
                  )}
                >
                  {!activeCategory && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <span>All Categories</span>
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full text-left py-1 text-xs transition-colors cursor-pointer group",
                      isSelected ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCategoryToggle(cat.id)}
                      className="pointer-events-none"
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Collections */}
      {collections.length > 0 && (
        <div className="border-b border-border/50 pb-6">
          <button
            type="button"
            onClick={() => toggleSection("collections")}
            className="flex items-center justify-between w-full text-left font-serif text-sm tracking-wider uppercase text-foreground mb-3 cursor-pointer group"
            aria-expanded={openSections.collections}
          >
            <span className="group-hover:text-accent transition-colors">Collection</span>
            {openSections.collections ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          {openSections.collections && (
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateFilters("collection", undefined)}
                className={cn(
                  "flex items-center gap-2.5 w-full text-left py-1 text-xs transition-colors cursor-pointer group",
                  !activeCollection ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors",
                    !activeCollection ? "border-accent bg-accent/15" : "border-border/80 group-hover:border-border"
                  )}
                >
                  {!activeCollection && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <span>All Collections</span>
              </button>

              {collections.map((col) => {
                const isSelected = activeCollection === col.slug;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleCollectionToggle(col.slug)}
                    className={cn(
                      "flex items-center gap-2.5 w-full text-left py-1 text-xs transition-colors cursor-pointer group",
                      isSelected ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCollectionToggle(col.slug)}
                      className="pointer-events-none"
                    />
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Price Filter */}
      <div className="border-b border-border/50 pb-6">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-left font-serif text-sm tracking-wider uppercase text-foreground mb-3 cursor-pointer group"
          aria-expanded={openSections.price}
        >
          <span className="group-hover:text-accent transition-colors">Price (INR)</span>
          {openSections.price ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {openSections.price && (
          <div className="space-y-4 mt-2">
            {/* Quick Price Preset Buttons */}
            <div className="flex flex-col gap-1.5">
              {PRICE_PRESETS.map((preset) => {
                const isPresetActive =
                  (preset.min === undefined ? !activeMinPrice : activeMinPrice === preset.min.toString()) &&
                  (preset.max === undefined ? !activeMaxPrice : activeMaxPrice === preset.max.toString());

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (isPresetActive) {
                        handlePricePreset(undefined, undefined);
                      } else {
                        handlePricePreset(preset.min, preset.max);
                      }
                    }}
                    className={cn(
                      "text-left text-xs py-1.5 px-2.5 rounded-xs transition-colors border",
                      isPresetActive
                        ? "bg-accent/10 border-accent/60 text-accent font-medium"
                        : "bg-surface/30 border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Rupee Range */}
            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-2 font-medium">
                Custom Range (₹)
              </span>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground select-none">₹</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => {
                      setMinPriceInput(e.target.value);
                      setPriceError("");
                    }}
                    className="pl-6 pr-2 h-8 text-xs bg-surface/40"
                    aria-label="Minimum price in Rupees"
                  />
                </div>
                <span className="text-muted-foreground text-xs">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs text-muted-foreground select-none">₹</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => {
                      setMaxPriceInput(e.target.value);
                      setPriceError("");
                    }}
                    className="pl-6 pr-2 h-8 text-xs bg-surface/40"
                    aria-label="Maximum price in Rupees"
                  />
                </div>
              </div>

              {priceError && (
                <p className="text-[11px] text-destructive mt-1.5" role="alert">
                  {priceError}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCustomPriceApply}
                className="w-full mt-3 uppercase tracking-widest text-[10px] h-8 border-border hover:bg-foreground hover:text-background"
              >
                Apply Range
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reset All Filters Button */}
      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/products", { scroll: false })}
          className="w-full text-xs text-muted-foreground hover:text-accent gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All ({activeFilterCount})</span>
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden lg:block", className)} aria-label="Catalog Filters">
        <div className="sticky top-28 bg-surface/20 p-5 rounded-xs border border-border/40 backdrop-blur-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
            <h2 className="font-serif text-sm tracking-wider uppercase text-foreground font-medium flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
              <span>Refine Catalog</span>
            </h2>
            {activeFilterCount > 0 && (
              <span className="text-[10px] uppercase tracking-widest text-accent font-medium">
                {activeFilterCount} Active
              </span>
            )}
          </div>
          {renderFilterBody()}
        </div>
      </aside>

      {/* Mobile Drawer Wrapper for use in mobile toolbars */}
      <div className="lg:hidden">
        <MobileFilterDrawer
          categories={categories}
          collections={collections}
          activeFilterCount={activeFilterCount}
        >
          {renderFilterBody()}
        </MobileFilterDrawer>
      </div>
    </>
  );
}
