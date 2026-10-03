import { Suspense, cache } from "react";
import { LocalErrorBoundary } from "@/components/ui/local-error-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { Metadata } from "next";
import { ProductSummary, CategoryTree, Collection } from "@/types/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { FilterChips } from "@/components/catalog/FilterChips";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CatalogSortSelect } from "@/components/catalog/CatalogSortSelect";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";

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

import { env } from "@/utils/env";

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;

  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }
  const canonicalUrl = `${baseUrl}/products`;

  // Search pages should generally not be indexed to prevent infinite crawl spaces
  if (params.q) {
    return {
      title: `Search: "${params.q}" | AHANKARA STUDIOS`,
      description: `Explore search results for "${params.q}" across our luxury atelier collections.`,
      robots: { index: false, follow: true },
      alternates: { canonical: canonicalUrl },
    };
  }

  if (params.collection) {
    return {
      title: `Collection | AHANKARA STUDIOS`,
      description: "Discover curated seasonal edits and atelier collection releases.",
      alternates: { canonical: canonicalUrl },
    };
  }

  if (params.category) {
    return {
      title: `Category | AHANKARA STUDIOS`,
      description: "Discover our bespoke Indian luxury fashion silhouettes.",
      alternates: { canonical: canonicalUrl },
    };
  }

  return {
    title: "Atelier Catalog | AHANKARA STUDIOS",
    description: "Discover our premium collection of contemporary luxury fashion pieces.",
    alternates: { canonical: canonicalUrl },
  };
}

const getProducts = cache(async (params: SearchParamsObject) => {
  try {
    const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
    const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;

    return await ProductService.getPublicProducts({
      search: params.q,
      categoryId: params.category,
      collectionSlug: params.collection,
      sortBy: (params.sort as "newest" | "price-low-high" | "price-high-low" | "name" | undefined) || "newest",
      page: params.page ? parseInt(params.page, 10) : 1,
      minPrice: !isNaN(minPrice as number) ? minPrice : undefined,
      maxPrice: !isNaN(maxPrice as number) ? maxPrice : undefined,
      limit: 12,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
});

async function getTaxonomyData() {
  try {
    const [categoriesTree, collections] = await Promise.all([
      CategoryService.getCategoryTree(true),
      CollectionService.getCollections(true),
    ]);
    return { categoriesTree, collections };
  } catch (error) {
    console.error("Failed to fetch taxonomy data", error);
    return { categoriesTree: null, collections: null };
  }
}

async function ProductCount({ params }: { params: SearchParamsObject }) {
  const productsResponse = await getProducts(params);
  const totalResults = productsResponse?.meta?.total ?? 0;
  const currentCount = productsResponse?.data?.length ?? 0;

  return (
    <p className="hidden lg:block text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">
      Showing <span className="font-medium text-foreground">{currentCount}</span> of{" "}
      <span className="font-medium text-foreground">{totalResults}</span> pieces
    </p>
  );
}

async function ProductResults({ params, hasActiveFilters }: { params: SearchParamsObject, hasActiveFilters: boolean }) {
  const productsResponse = await getProducts(params);

  if (!productsResponse || productsResponse.data.length === 0) {
    return (
      <CatalogEmptyState
        searchQuery={params.q}
        hasActiveFilters={hasActiveFilters}
        isError={false}
      />
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-3.5 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:gap-x-6 lg:gap-y-12">
        {productsResponse.data.map((product) => (
          <ProductCard
            key={product.id}
            product={product as unknown as ProductSummary}
          />
        ))}
      </div>

      {productsResponse.meta.totalPages > 1 && (
        <CatalogPagination
          meta={productsResponse.meta}
          searchParams={params}
        />
      )}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { categoriesTree, collections } = await getTaxonomyData();

  // Active collection or category contextual details
  const activeCollectionObj = params.collection && collections
    ? collections.find((col) => col.slug === params.collection)
    : null;

  const activeCategoryObj = params.category && categoriesTree
    ? categoriesTree.find((cat) => cat.id === params.category)
    : null;

  const hasActiveFilters = Boolean(
    params.q || params.category || params.collection || params.minPrice || params.maxPrice
  );

  const pageTitle = params.q
    ? `Search: "${params.q}"`
    : activeCollectionObj
    ? activeCollectionObj.name
    : activeCategoryObj
    ? activeCategoryObj.name
    : "All Creations";

  const pageDescription = activeCollectionObj?.description
    ? activeCollectionObj.description
    : activeCategoryObj?.description
    ? activeCategoryObj.description
    : "Meticulously crafted contemporary Indian silhouettes, tailored for discerning wardrobes.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Editorial Header Section */}
      <section className="border-b border-border/40 bg-surface/30 pt-8 pb-10 md:pt-12 md:pb-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent font-medium select-none block mb-2.5">
              AHANKARA STUDIOS / ATELIER DISCOVERY
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-foreground leading-[1.1] mb-3">
              {pageTitle}
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-2xl">
              {pageDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Sticky / Inline Controls Toolbar */}
        <div className="flex items-center justify-between gap-4 pb-6 mb-2 border-b border-border/40">
          {/* Left: Mobile Filter Trigger / Desktop Pieces Count */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              {categoriesTree && collections ? (
                <CatalogFilters
                  categories={categoriesTree}
                  collections={collections}
                  initialParams={params}
                />
              ) : (
                <ErrorState variant="inline" title="Filters Unavailable" message="Cannot load taxonomy." />
              )}
            </div>
            <Suspense fallback={<div className="hidden lg:block w-36 h-4 bg-muted/60 animate-pulse rounded-xs" />}>
              <ProductCount params={params} />
            </Suspense>
          </div>

          {/* Right: Luxury Sort Selector */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-muted-foreground font-light">
              Sort:
            </span>
            <CatalogSortSelect currentSort={params.sort} />
          </div>
        </div>

        {/* 2-Column Layout: Sidebar + Product Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 pt-4">
          {/* Desktop Filter Sidebar */}
          <div className="w-64 xl:w-72 shrink-0 hidden lg:block">
            {categoriesTree && collections ? (
              <CatalogFilters
                categories={categoriesTree}
                collections={collections}
                initialParams={params}
              />
            ) : (
              <ErrorState variant="inline" title="Filters Unavailable" message="Cannot load taxonomy." />
            )}
          </div>

          {/* Product Listing Main Column */}
          <main className="flex-1 min-w-0" id="catalog-products-main">
            {/* Active Filter Chips */}
            {categoriesTree && collections && (
              <FilterChips categories={categoriesTree as CategoryTree[]} collections={collections as Collection[]} />
            )}

            <LocalErrorBoundary title="Unable to load catalog" message="We encountered an issue retrieving the latest creations.">
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-x-3.5 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:gap-x-6 lg:gap-y-12">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <ProductResults params={params} hasActiveFilters={hasActiveFilters} />
              </Suspense>
            </LocalErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
