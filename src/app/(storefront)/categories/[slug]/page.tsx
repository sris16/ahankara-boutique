import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryService } from "@/server/services/category.service";
import { ProductService } from "@/server/services/product.service";
import { NotFoundError } from "@/utils/errors";
import { ProductSummary } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { BreadcrumbJsonLd } from "@/components/product/BreadcrumbJsonLd";
import { CatalogSortSelect } from "@/components/catalog/CatalogSortSelect";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { ChevronRight } from "lucide-react";

export const revalidate = 60; // Revalidate every minute to keep inventory badges fresh

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

import { env } from "@/utils/env";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const category = await CategoryService.getCategoryBySlug(resolvedParams.slug, true);
    
    let baseUrl = env.BETTER_AUTH_URL;
    if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
      baseUrl = "https://ahankarastudios.com";
    }
    const canonicalUrl = `${baseUrl}/categories/${category.slug}`;
    const title = category.metaTitle || `${category.name} | AHANKARA STUDIOS`;
    const description = category.metaDescription || category.description || `Explore our ${category.name} collection at AHANKARA STUDIOS.`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: category.imageUrl ? [{ url: category.imageUrl }] : [],
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError || (error as Error).name === "NotFoundError") {
      return {
        title: "Category Not Found | AHANKARA STUDIOS",
      };
    }
    throw error;
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;
  let category;

  try {
    category = await CategoryService.getCategoryBySlug(resolvedParams.slug, true);
  } catch (error) {
    if (error instanceof NotFoundError || (error as Error).name === "NotFoundError") {
      notFound();
    }
    throw error;
  }

  const sortBy = (resolvedQuery.sort as "newest" | "price-low-high" | "price-high-low" | "name" | undefined) || "newest";

  // Fetch associated products
  const productsResponse = await ProductService.getPublicProducts({
    categoryId: category.id,
    limit: 100, // Fetch up to 100 products for the landing page grid
    page: 1,
    sortBy,
  }).catch(() => null);

  const products = productsResponse?.data || [];
  const totalCount = productsResponse?.meta?.total ?? products.length;

  return (
    <>
      <BreadcrumbJsonLd 
        items={[
          { name: "Home", url: "/" },
          { name: "Catalog", url: "/products" },
          { name: category.name, url: `/categories/${category.slug}` }
        ]} 
      />
      <div className="flex flex-col min-h-screen bg-background pb-24">
        {/* Semantic Breadcrumbs Bar */}
        <div className="border-b border-border/40 bg-surface/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <nav
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground overflow-x-auto whitespace-nowrap hide-scrollbar"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-foreground transition-colors shrink-0">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />
              <Link href="/products" className="hover:text-foreground transition-colors shrink-0">
                Catalog
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />
              <span className="text-foreground font-medium shrink-0">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Refined Category Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {category.imageUrl ? (
            /* Restrained Photographic Banner */
            <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] max-h-[300px] rounded-xs overflow-hidden border border-border/60 bg-surface-muted mb-8 shadow-xs flex items-end">
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              <div className="relative z-10 p-6 sm:p-10 max-w-2xl text-white">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 block mb-2">
                  Category Archive
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight leading-tight mb-2">
                  {category.name}
                </h1>
                {category.description && (
                  <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed line-clamp-2">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Refined Typographic Masthead (Zero fake imagery) */
            <div className="max-w-3xl pb-4">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-accent font-medium select-none block mb-2">
                AHANKARA STUDIOS &mdash; Category Archive
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground leading-[1.08] mb-3">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          )}

          {/* Controls & Sorting Toolbar */}
          <div className="flex items-center justify-between gap-4 pt-4 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light select-none">
                Showing <span className="font-medium text-foreground">{products.length}</span> of{" "}
                <span className="font-medium text-foreground">{totalCount}</span> silhouettes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-muted-foreground font-light select-none">
                Sort:
              </span>
              <CatalogSortSelect currentSort={sortBy} />
            </div>
          </div>
        </section>

        {/* Product Discovery Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label={`${category.name} Products`}>
          {!productsResponse ? (
            <div className="py-20">
              <CatalogEmptyState isError={true} />
            </div>
          ) : products.length === 0 ? (
            <div className="py-20">
              <CatalogEmptyState />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:gap-x-7 lg:gap-y-14">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product as unknown as ProductSummary}
                  priority={idx < 2}
                />
              ))}
            </div>
          )}

          {products.length > 0 && productsResponse?.meta && productsResponse.meta.total > 100 && (
            <div className="flex justify-center mt-16 pt-8 border-t border-border/40">
              <Link
                href={`/products?category=${category.id}`}
                className="border border-border/80 bg-surface/30 hover:bg-surface text-foreground px-8 py-3.5 text-xs uppercase tracking-[0.2em] rounded-xs hover:border-foreground transition-colors"
              >
                View Complete {category.name} Catalog &rarr;
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

