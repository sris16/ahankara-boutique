"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { CategoryTree, Collection } from "@/types/catalog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileFilterDrawerProps {
  categories: CategoryTree[];
  collections: Collection[];
  activeFilterCount: number;
  children: React.ReactNode;
}

export function MobileFilterDrawer({
  activeFilterCount,
  children,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleClearAll = () => {
    router.push("/products", { scroll: false });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open filter and sort drawer"
          className="flex items-center justify-between gap-2.5 px-4 py-2.5 bg-surface border border-border/70 hover:border-border text-foreground text-xs uppercase tracking-widest rounded-xs transition-colors duration-200 cursor-pointer min-h-[44px]"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>Filter</span>
          </div>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-accent-foreground font-medium rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-background border-l border-border p-0 flex flex-col z-[100]"
      >
        <SheetHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
          <SheetTitle className="font-serif text-lg tracking-wider uppercase text-foreground">
            Filter & Refine
          </SheetTitle>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mr-6 cursor-pointer"
            >
              Reset All
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        <div className="p-4 border-t border-border/60 bg-surface/40 flex items-center gap-3">
          {activeFilterCount > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAll}
              className="flex-1 text-xs uppercase tracking-widest min-h-[44px]"
            >
              Clear All
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 text-xs uppercase tracking-widest min-h-[44px] bg-foreground text-background hover:bg-foreground/90"
          >
            Show Pieces
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
