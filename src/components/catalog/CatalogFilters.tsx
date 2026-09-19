"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategoryTree, Collection } from "@/types/catalog";
import { Search, Filter, X } from "lucide-react";

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
}

export function CatalogFilters({ categories, collections, initialParams }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialParams.q || "");

  const initialMinRs = initialParams.minPrice ? Math.floor(Number(initialParams.minPrice) / 100).toString() : "";
  const initialMaxRs = initialParams.maxPrice ? Math.floor(Number(initialParams.maxPrice) / 100).toString() : "";

  const [minPriceInput, setMinPriceInput] = useState(initialMinRs);
  const [maxPriceInput, setMaxPriceInput] = useState(initialMaxRs);
  const [priceError, setPriceError] = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle body scroll and escape key when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      // Focus the first focusable element inside drawer if needed (skipped for simplicity, but we can focus the close button)
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    updateFilters("q", searchQuery);
  };

  const handlePriceApply = () => {
    setPriceError("");
    const min = minPriceInput ? parseInt(minPriceInput, 10) : NaN;
    const max = maxPriceInput ? parseInt(maxPriceInput, 10) : NaN;

    if (!isNaN(min) && !isNaN(max) && min > max) {
      setPriceError("Minimum price cannot be greater than maximum price.");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (!isNaN(min) && min >= 0) {
      params.set("minPrice", (min * 100).toString());
    } else {
      params.delete("minPrice");
    }

    if (!isNaN(max) && max >= 0) {
      params.set("maxPrice", (max * 100).toString());
    } else {
      params.delete("maxPrice");
    }

    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const renderFilterContent = (isMobile = false) => (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <div>
        <h3 className="font-medium text-sm tracking-widest uppercase mb-4">Search</h3>
        <form onSubmit={(e) => { handleSearch(e); if (isMobile) setIsOpen(false); }} className="relative">
          <input
            type="text"
            placeholder="Search pieces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-sm bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <button type="submit" className="hidden">Submit</button>
        </form>
      </div>

      {/* Sort */}
      <div>
        <h3 className="font-medium text-sm tracking-widest uppercase mb-4">Sort By</h3>
        <select
          value={initialParams.sort || "newest"}
          onChange={(e) => { updateFilters("sort", e.target.value); if (isMobile) setIsOpen(false); }}
          className="w-full p-2 border rounded-sm bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-foreground appearance-none"
        >
          <option value="newest">Newest</option>
          <option value="price-low-high">Price: Low to High</option>
          <option value="price-high-low">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="font-medium text-sm tracking-widest uppercase mb-4">Categories</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => { updateFilters("category", ""); if (isMobile) setIsOpen(false); }}
                className={`text-sm hover:underline ${!initialParams.category ? "font-medium underline" : "text-muted-foreground"}`}
              >
                All Categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => { updateFilters("category", cat.id); if (isMobile) setIsOpen(false); }}
                  className={`text-sm hover:underline ${initialParams.category === cat.id ? "font-medium underline" : "text-muted-foreground"}`}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <h3 className="font-medium text-sm tracking-widest uppercase mb-4">Collections</h3>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => { updateFilters("collection", ""); if (isMobile) setIsOpen(false); }}
                className={`text-sm hover:underline ${!initialParams.collection ? "font-medium underline" : "text-muted-foreground"}`}
              >
                All Collections
              </button>
            </li>
            {collections.map((col) => (
              <li key={col.id}>
                <button
                  onClick={() => { updateFilters("collection", col.slug); if (isMobile) setIsOpen(false); }}
                  className={`text-sm hover:underline ${initialParams.collection === col.slug ? "font-medium underline" : "text-muted-foreground"}`}
                >
                  {col.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-medium text-sm tracking-widest uppercase mb-4">Price Range</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-2 text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => {
                  setMinPriceInput(e.target.value);
                  setPriceError("");
                }}
                className="w-full pl-6 pr-2 py-2 border rounded-sm bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-2 text-sm text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => {
                  setMaxPriceInput(e.target.value);
                  setPriceError("");
                }}
                className="w-full pl-6 pr-2 py-2 border rounded-sm bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>
          {priceError && (
            <p className="text-xs text-destructive mt-1">{priceError}</p>
          )}
          <button
            onClick={() => {
              handlePriceApply();
              if (isMobile && !priceError) {
                // We don't automatically close on apply, but we could.
              }
            }}
            className="w-full py-2 bg-secondary text-foreground text-sm font-medium tracking-widest uppercase mt-2 rounded-sm hover:bg-secondary/80 transition-colors"
          >
            Apply Price
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-controls="mobile-filter-drawer"
          className="flex items-center gap-2 px-4 py-2 border rounded-sm w-full justify-center bg-foreground text-background text-sm font-medium tracking-widest uppercase"
        >
          <Filter className="w-4 h-4" />
          Filter & Sort
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {renderFilterContent(false)}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
            aria-hidden="true"
          />
          <div
            id="mobile-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filter and Sort Products"
            ref={drawerRef}
            className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-background border-l shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-medium tracking-widest uppercase">Filter & Sort</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className="p-2"
                aria-label="Close filters"
                autoFocus
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {renderFilterContent(true)}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-foreground text-background py-3 text-sm font-medium tracking-widest uppercase"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
