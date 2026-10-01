"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface CatalogEmptyStateProps {
  searchQuery?: string;
  hasActiveFilters?: boolean;
}

export function CatalogEmptyState({ searchQuery, hasActiveFilters }: CatalogEmptyStateProps) {
  const router = useRouter();

  const handleReset = () => {
    router.push("/products");
  };

  return (
    <div className="py-24 px-6 text-center border border-border/60 bg-gradient-to-b from-surface/60 to-surface-muted/30 rounded-xs flex flex-col items-center justify-center my-6">
      <div className="relative w-14 h-14 rounded-full overflow-hidden border border-border/80 mb-5 opacity-60 shadow-xs">
        <Image
          src="/images/brand/ahankara-studios-logo.jpg"
          alt="AHANKARA STUDIOS"
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>

      <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-medium mb-2">
        Atelier Catalog
      </span>

      <h3 className="font-serif text-2xl md:text-3xl text-foreground font-normal tracking-tight mb-3">
        {searchQuery ? `No Pieces Found for "${searchQuery}"` : "No Pieces Found"}
      </h3>

      <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed mb-8 font-light">
        {hasActiveFilters || searchQuery
          ? "We could not find any creations matching your current selection. Try resetting filters to explore the complete atelier collection."
          : "Our artisans are currently curating this collection. Please explore our other categories or check back soon."}
      </p>

      {(hasActiveFilters || searchQuery) && (
        <Button
          onClick={handleReset}
          variant="outline"
          className="uppercase tracking-widest text-xs min-h-[44px] px-8 border-border hover:bg-foreground hover:text-background transition-colors duration-300"
        >
          Reset All Filters
        </Button>
      )}
    </div>
  );
}
