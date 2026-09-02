"use client";

import { useState, FormEvent } from "react";
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
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsOpen(true)}
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
            onClick={() => setIsOpen(false)} 
          />
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-background border-l shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-medium tracking-widest uppercase">Filter & Sort</span>
              <button onClick={() => setIsOpen(false)} className="p-2">
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
