import { Suspense } from "react";
import { Collection, ProductSummary } from "@/types/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { FilterChips } from "@/components/catalog/FilterChips";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Metadata } from "next";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";

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
  try {
    const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
    const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;

    const [productsResponse, categoriesTree, collections] = await Promise.all([
      ProductService.getPublicProducts({
        search: params.q,
        categoryId: params.category,
        collectionSlug: params.collection,
        sortBy: (params.sort as "newest" | "price-low-high" | "price-high-low" | "name" | undefined) || "newest",
        page: params.page ? parseInt(params.page, 10) : 1,
        minPrice: !isNaN(minPrice as number) ? minPrice : undefined,
        maxPrice: !isNaN(maxPrice as number) ? maxPrice : undefined,
        limit: 12,
      }).catch(() => null),
      CategoryService.getCategoryTree(true).catch(() => []),
      CollectionService.getCollections(true).catch(() => []), // true for active only
    ]);

    return { productsResponse, categoriesTree, collections };
  } catch (error) {
    console.error("Failed to fetch catalog data", error);
    return { productsResponse: null, categoriesTree: [], collections: [] };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { productsResponse, categoriesTree, collections } = await getCatalogData(params);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 flex flex-col md:flex-row gap-8 lg:gap-12 min-h-[70vh]">
      {/* Desktop Sidebar / Mobile Drawer included inside CatalogFilters */}
      <aside className="w-full md:w-64 shrink-0">
        <CatalogFilters
          categories={categoriesTree}
          collections={collections}
          initialParams={params}
        />
      </aside>

      <main className="flex-1 min-w-0">
        <FilterChips categories={categoriesTree} collections={collections} />

        <div className="flex flex-col gap-2 mb-10">
          <h1 className="font-serif text-3xl md:text-5xl tracking-tight text-foreground">
            {params.q ? `Search: ${params.q}` : "All Pieces"}
          </h1>
          {productsResponse?.meta && (
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mt-2">
              Showing {productsResponse.data.length} of {productsResponse.meta.total} results
            </p>
          )}
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        }>
          {!productsResponse || productsResponse.data.length === 0 ? (
            <div className="py-32 text-center bg-brand-50 border border-brand-200/50 flex flex-col items-center justify-center">
              <h3 className="font-serif text-2xl mb-4 text-foreground">No pieces found</h3>
              <p className="text-muted-foreground font-light max-w-md">
                We couldn&apos;t find anything matching your search or filters. Try exploring different collections or categories.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
                {productsResponse.data.map((product) => (
                  <ProductCard key={product.id} product={product as unknown as ProductSummary} />
                ))}
              </div>

              {/* Pagination */}
              {productsResponse.meta.totalPages > 1 && (
                <div className="flex justify-center items-center mt-20 pt-10 border-t border-brand-200/50">
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
