import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { ProductListResponse } from "@/types/catalog";

type SearchParamsObject = {
  [key: string]: string | undefined;
};

interface CatalogPaginationProps {
  meta: ProductListResponse["meta"];
  searchParams: SearchParamsObject;
}

export function CatalogPagination({ meta, searchParams }: CatalogPaginationProps) {
  const currentPage = meta.page;
  const totalPages = meta.totalPages;

  if (totalPages <= 1) return null;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
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

      // Adjust window if at the edges
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
    <nav className="flex items-center gap-1" aria-label="Pagination">
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="p-2 border rounded-sm hover:bg-muted transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <div className="p-2 border rounded-sm opacity-50 cursor-not-allowed" aria-hidden="true">
          <ChevronLeft className="w-4 h-4" />
        </div>
      )}

      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis") {
            return (
              <div key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            );
          }

          const isActive = page === currentPage;
          return (
            <Link
              key={page}
              href={buildPageUrl(page)}
              aria-current={isActive ? "page" : undefined}
              className={`min-w-[32px] h-8 flex items-center justify-center rounded-sm text-sm border transition-colors ${
                isActive
                  ? "bg-foreground text-background font-medium border-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="p-2 border rounded-sm hover:bg-muted transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="p-2 border rounded-sm opacity-50 cursor-not-allowed" aria-hidden="true">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </nav>
  );
}
