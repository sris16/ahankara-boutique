import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { PaginationMeta } from "@/types/catalog";
import { cn } from "@/lib/utils";

type SearchParamsObject = {
  [key: string]: string | undefined;
};

interface CatalogPaginationProps {
  meta: PaginationMeta;
  searchParams: SearchParamsObject;
  className?: string;
}

export function CatalogPagination({ meta, searchParams, className }: CatalogPaginationProps) {
  const currentPage = meta.page;
  const totalPages = meta.totalPages;

  if (totalPages <= 1) return null;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined) {
        params.set(k, v);
      }
    });
    params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        endPage = 3;
      }
      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }

      if (startPage > 2) {
        pages.push("ellipsis");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 w-full pt-8 pb-4 border-t border-border/50", className)}
      aria-label="Catalog Pagination"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light select-none">
        Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span> ({meta.total} pieces total)
      </div>

      <div className="flex items-center gap-1.5">
        {/* Previous Page */}
        {currentPage > 1 ? (
          <Link
            href={buildPageUrl(currentPage - 1)}
            scroll={false}
            className="w-9 h-9 flex items-center justify-center rounded-xs border border-border/60 bg-surface/40 hover:bg-surface hover:border-border text-foreground transition-colors cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        ) : (
          <div
            className="w-9 h-9 flex items-center justify-center rounded-xs border border-border/30 bg-surface/20 text-muted-foreground/40 cursor-not-allowed select-none"
            aria-hidden="true"
          >
            <ChevronLeft className="w-4 h-4" />
          </div>
        )}

        {/* Numbered Pages */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="w-7 h-9 flex items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </div>
              );
            }

            const isActive = page === currentPage;
            return (
              <Link
                key={page}
                href={buildPageUrl(page)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "min-w-[36px] h-9 px-2 flex items-center justify-center rounded-xs text-xs tracking-wider transition-colors duration-200 select-none",
                  isActive
                    ? "bg-foreground text-background font-medium shadow-xs pointer-events-none"
                    : "border border-border/60 bg-surface/30 hover:bg-surface hover:border-border text-muted-foreground hover:text-foreground cursor-pointer"
                )}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next Page */}
        {currentPage < totalPages ? (
          <Link
            href={buildPageUrl(currentPage + 1)}
            scroll={false}
            className="w-9 h-9 flex items-center justify-center rounded-xs border border-border/60 bg-surface/40 hover:bg-surface hover:border-border text-foreground transition-colors cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div
            className="w-9 h-9 flex items-center justify-center rounded-xs border border-border/30 bg-surface/20 text-muted-foreground/40 cursor-not-allowed select-none"
            aria-hidden="true"
          >
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </nav>
  );
}
