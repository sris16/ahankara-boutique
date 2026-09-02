import { Suspense } from "react";
import { apiClient } from "@/lib/api/client";
import { ProductListResponse, CategoryTree, Collection } from "@/types/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalog | AHANKARA STUDIOS",
  description: "Discover our premium collection of fashion pieces.",
};

type SearchParamsObject = {
  q?: string;
  category?: string;
  collection?: string;
  sort?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
};

interface ProductsPageProps {
  searchParams: Promise<SearchParamsObject>;
}

async function getCatalogData(params: SearchParamsObject) {
  const [productsResponse, categoriesTree, collections] = await Promise.all([
    apiClient.get<ProductListResponse>("/api/products", {
      params: {
        search: params.q,
        categoryId: params.category,
        collectionSlug: params.collection,
        sortBy: params.sort || "newest",
        page: params.page || 1,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
      },
    }).catch(() => null),
    apiClient.get<CategoryTree[]>("/api/categories", { params: { tree: true } }).catch(() => []),
    apiClient.get<Collection[]>("/api/collections").catch(() => []),
  ]);

  return { productsResponse, categoriesTree, collections };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { productsResponse, categoriesTree, collections } = await getCatalogData(params);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
      {/* Desktop Sidebar / Mobile Drawer included inside CatalogFilters */}
      <aside className="w-full md:w-64 shrink-0">
        <CatalogFilters 
          categories={categoriesTree} 
          collections={collections} 
          initialParams={params} 
        />
      </aside>

      <main className="flex-1 min-w-0">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl">
            {params.q ? `Search: ${params.q}` : "All Pieces"}
          </h1>
          {productsResponse?.meta && (
            <p className="text-sm text-muted-foreground uppercase tracking-widest">
              Showing {productsResponse.data.length} of {productsResponse.meta.total} results
            </p>
          )}
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        }>
          {!productsResponse || productsResponse.data.length === 0 ? (
            <div className="py-32 text-center bg-muted/20 border border-dashed rounded-sm">
              <h3 className="font-medium text-lg mb-2">No pieces found</h3>
              <p className="text-muted-foreground">We couldn&apos;t find anything matching your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {productsResponse.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {productsResponse.meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16 pt-8 border-t">
                  <CatalogPagination meta={productsResponse.meta} searchParams={params} />
                </div>
              )}
            </>
          )}
        </Suspense>
      </main>
    </div>
  );
}

// Inline simple pagination component for Server Side
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function CatalogPagination({ 
  meta, 
  searchParams 
}: { 
  meta: ProductListResponse["meta"], 
  searchParams: SearchParamsObject
}) {
  const currentPage = meta.page;
  const totalPages = meta.totalPages;

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set("page", page.toString());
    return `/products?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-1">
      {currentPage > 1 ? (
        <Link 
          href={buildPageUrl(currentPage - 1)} 
          className="p-2 border rounded-sm hover:bg-muted transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <div className="p-2 border rounded-sm opacity-50 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </div>
      )}

      <div className="px-4 py-2 text-sm font-medium">
        Page {currentPage} of {totalPages}
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
        <div className="p-2 border rounded-sm opacity-50 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
