import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionService } from "@/server/services/collection.service";
import { ProductService } from "@/server/services/product.service";
import { ProductSummary } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ArrowLeft, Clock } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const collection = await CollectionService.getCollectionBySlug(resolvedParams.slug, true);
    return {
      title: collection.metaTitle || `${collection.name} | AHANKARA STUDIOS`,
      description: collection.metaDescription || collection.description || `Explore our ${collection.name} collection at AHANKARA STUDIOS.`,
    };
  } catch {
    return {
      title: "Collection Not Found | AHANKARA STUDIOS",
    };
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const resolvedParams = await params;
  let collection;

  try {
    collection = await CollectionService.getCollectionBySlug(resolvedParams.slug, true);
  } catch {
    notFound();
  }

  // Check if collection has date constraints
  const now = new Date();
  const hasStarted = !collection.startsAt || new Date(collection.startsAt) <= now;
  const hasEnded = collection.endsAt && new Date(collection.endsAt) < now;

  // We still fetch products even if not started/ended, but the public query will naturally filter them if the DB logic requires it.
  // Actually, ProductService.getPublicProducts checks if the collection is active natively.
  const productsResponse = await ProductService.getPublicProducts({
    collectionSlug: collection.slug,
    limit: 100, // Fetch up to 100 products for the landing page grid
    page: 1,
    sortBy: "newest"
  }).catch(() => null);

  const products = productsResponse?.data || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Editorial Hero */}
      <section className="relative w-full h-[65vh] md:h-[80vh] bg-foreground flex items-end justify-center overflow-hidden">
        {collection.imageUrl ? (
          <>
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              priority
              className="object-cover object-center opacity-80"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-secondary/20" />
        )}

        <div className="relative z-10 w-full container mx-auto px-4 pb-16 md:pb-24 flex flex-col items-center text-center md:items-start md:text-left">
          {collection.startsAt && !hasStarted && (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] uppercase tracking-widest border border-white/20">
              <Clock className="w-3 h-3" />
              <span>Available {new Date(collection.startsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          )}

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 text-white max-w-4xl">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="text-base md:text-lg max-w-2xl font-light leading-relaxed text-white/90">
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Breadcrumb / Nav */}
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>

      {/* Product Discovery */}
      <section className="container mx-auto px-4">
        {hasEnded ? (
          <div className="py-24 text-center bg-muted/10 border border-dashed rounded-sm flex flex-col items-center justify-center">
            <h3 className="font-serif text-2xl mb-4 text-foreground">Collection Closed</h3>
            <p className="text-muted-foreground font-light max-w-md mb-8">
              This collection is no longer available. Discover our latest arrivals and ongoing collections.
            </p>
            <Link
              href="/products"
              className="border border-foreground text-foreground px-8 py-3 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              Explore Catalog
            </Link>
          </div>
        ) : !hasStarted ? (
          <div className="py-24 text-center bg-muted/10 border border-dashed rounded-sm flex flex-col items-center justify-center">
            <h3 className="font-serif text-2xl mb-4 text-foreground">Coming Soon</h3>
            <p className="text-muted-foreground font-light max-w-md mb-8">
              The {collection.name} collection will be available starting {new Date(collection.startsAt!).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center bg-muted/10 border border-dashed rounded-sm flex flex-col items-center justify-center">
            <h3 className="font-serif text-2xl mb-4 text-foreground">No pieces currently available</h3>
            <p className="text-muted-foreground font-light max-w-md mb-8">
              We are currently preparing the pieces for {collection.name}. Please check back later.
            </p>
            <Link
              href="/products"
              className="border border-foreground text-foreground px-8 py-3 text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as unknown as ProductSummary} />
            ))}
          </div>
        )}

        {products.length > 0 && productsResponse?.meta && productsResponse.meta.total > 100 && (
          <div className="flex justify-center mt-16">
            <Link
              href={`/products?collection=${collection.slug}`}
              className="border border-border text-foreground px-8 py-4 text-xs uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              View All {collection.name} Pieces
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
