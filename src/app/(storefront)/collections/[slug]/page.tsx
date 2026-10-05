import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionService } from "@/server/services/collection.service";
import { ProductService } from "@/server/services/product.service";
import { NotFoundError } from "@/utils/errors";
import { ProductSummary } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { BreadcrumbJsonLd } from "@/components/product/BreadcrumbJsonLd";
import { CatalogSortSelect } from "@/components/catalog/CatalogSortSelect";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { ChevronRight, Clock } from "lucide-react";

export const revalidate = 60; // Revalidate every minute to keep inventory badges fresh

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}

import { env } from "@/utils/env";

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const collection = await CollectionService.getCollectionBySlug(resolvedParams.slug, true);
    
    let baseUrl = env.BETTER_AUTH_URL;
    if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
      baseUrl = "https://ahankarastudios.com";
    }
    const canonicalUrl = `${baseUrl}/collections/${collection.slug}`;
    const title = collection.metaTitle || `${collection.name} | AHANKARA STUDIOS`;
    const description = collection.metaDescription || collection.description || `Explore our ${collection.name} collection at AHANKARA STUDIOS.`;

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
        images: collection.imageUrl ? [{ url: collection.imageUrl }] : [],
      },
    };
  } catch (error) {
    if (error instanceof NotFoundError || (error as Error).name === "NotFoundError") {
      return {
        title: "Collection Not Found | AHANKARA STUDIOS",
      };
    }
    throw error;
  }
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const resolvedParams = await params;
  const resolvedQuery = await searchParams;
  let collection;

  try {
    collection = await CollectionService.getCollectionBySlug(resolvedParams.slug, true);
  } catch (error) {
    if (error instanceof NotFoundError || (error as Error).name === "NotFoundError") {
      notFound();
    }
    throw error;
  }

  // Check if collection has date constraints
  const now = new Date();
  const hasStarted = !collection.startsAt || new Date(collection.startsAt) <= now;
  const hasEnded = collection.endsAt && new Date(collection.endsAt) < now;

  const sortBy = (resolvedQuery.sort as "newest" | "price-low-high" | "price-high-low" | "name" | undefined) || "newest";

  const productsResponse = await ProductService.getPublicProducts({
    collectionSlug: collection.slug,
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
          { name: collection.name, url: `/collections/${collection.slug}` }
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
              <span className="text-foreground font-medium shrink-0">{collection.name}</span>
            </nav>
          </div>
        </div>

        {/* Refined Collection Editorial Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {collection.imageUrl ? (
            /* Restrained Editorial Chapter Banner */
            <div className="relative w-full aspect-[21/9] sm:aspect-[24/8] max-h-[340px] rounded-xs overflow-hidden border border-border/60 bg-foreground mb-8 shadow-xs flex items-end">
              <Image
                src={collection.imageUrl}
                alt={collection.name}
                fill
                priority
                className="object-cover object-center opacity-85"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

              <div className="relative z-10 p-6 sm:p-10 max-w-3xl text-white">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/70">
                    Atelier Chapter
                  </span>
                  {collection.startsAt && !hasStarted && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-white/20 backdrop-blur-xs text-white text-[10px] font-mono tracking-wider uppercase border border-white/20">
                      <Clock className="w-3 h-3" />
                      Available {new Date(collection.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight leading-tight mb-2">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed line-clamp-2">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Architectural Obsidian Chapter Masthead (Zero fake imagery) */
            <div className="bg-foreground text-background p-8 sm:p-12 rounded-xs border border-border/60 mb-8 relative overflow-hidden shadow-xs">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
              <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-background/60">
                    AHANKARA STUDIOS &mdash; Atelier Chapter
                  </span>
                  {collection.startsAt && !hasStarted && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-background/10 text-background text-[10px] font-mono tracking-wider uppercase border border-background/20">
                      <Clock className="w-3 h-3" />
                      Available {new Date(collection.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-background leading-[1.08] mb-3">
                  {collection.name}
                </h1>

                {collection.description && (
                  <p className="text-background/70 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Controls & Sorting Toolbar */}
          <div className="flex items-center justify-between gap-4 pt-4 pb-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light select-none">
                Showing <span className="font-medium text-foreground">{products.length}</span> of{" "}
                <span className="font-medium text-foreground">{totalCount}</span> pieces
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
        <section className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label={`${collection.name} Products`}>
          {hasEnded ? (
            <div className="py-20 text-center border border-border/60 bg-surface/30 rounded-xs flex flex-col items-center justify-center p-8 max-w-lg mx-auto my-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent font-medium mb-2">
                Atelier Archive
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground font-normal tracking-tight mb-3">
                Collection Concluded
              </h2>
              <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
                This edition has completed its atelier presentation. Discover our ongoing permanent silhouettes.
              </p>
              <Link
                href="/products"
                className="bg-foreground text-background px-8 py-3 text-xs uppercase tracking-[0.2em] rounded-xs hover:bg-foreground/90 transition-colors"
              >
                Explore Current Pieces &rarr;
              </Link>
            </div>
          ) : !hasStarted ? (
            <div className="py-20 text-center border border-border/60 bg-surface/30 rounded-xs flex flex-col items-center justify-center p-8 max-w-lg mx-auto my-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent font-medium mb-2">
                Upcoming Release
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-foreground font-normal tracking-tight mb-3">
                Coming Soon
              </h2>
              <p className="text-muted-foreground text-sm font-light leading-relaxed mb-6">
                The {collection.name} collection will be revealed on{" "}
                {new Date(collection.startsAt!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
              </p>
              <Link
                href="/products"
                className="border border-border bg-surface hover:bg-surface-muted text-foreground px-8 py-3 text-xs uppercase tracking-[0.2em] rounded-xs transition-colors"
              >
                Browse Available Creations &rarr;
              </Link>
            </div>
          ) : !productsResponse ? (
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
                href={`/products?collection=${collection.slug}`}
                className="border border-border/80 bg-surface/30 hover:bg-surface text-foreground px-8 py-3.5 text-xs uppercase tracking-[0.2em] rounded-xs hover:border-foreground transition-colors"
              >
                View Complete {collection.name} Catalog &rarr;
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

