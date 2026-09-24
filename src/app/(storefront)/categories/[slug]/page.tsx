import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryService } from "@/server/services/category.service";
import { ProductService } from "@/server/services/product.service";
import { ProductSummary } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const category = await CategoryService.getCategoryBySlug(resolvedParams.slug, true);
    return {
      title: category.metaTitle || `${category.name} | AHANKARA STUDIOS`,
      description: category.metaDescription || category.description || `Explore our ${category.name} collection at AHANKARA STUDIOS.`,
    };
  } catch {
    return {
      title: "Category Not Found | AHANKARA STUDIOS",
    };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  let category;

  try {
    category = await CategoryService.getCategoryBySlug(resolvedParams.slug, true);
  } catch {
    notFound();
  }

  // Fetch associated products
  const productsResponse = await ProductService.getPublicProducts({
    categoryId: category.id,
    limit: 100, // Fetch up to 100 products for the landing page grid
    page: 1,
    sortBy: "newest"
  }).catch(() => null);

  const products = productsResponse?.data || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Editorial Hero */}
      <section className="relative w-full h-[60vh] md:h-[70vh] bg-muted/20 flex items-center justify-center overflow-hidden">
        {category.imageUrl ? (
          <>
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-secondary/30" />
        )}

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className={`font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 ${category.imageUrl ? 'text-white' : 'text-foreground'}`}>
            {category.name}
          </h1>
          {category.description && (
            <p className={`text-base md:text-lg max-w-2xl font-light leading-relaxed ${category.imageUrl ? 'text-white/90' : 'text-muted-foreground'}`}>
              {category.description}
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
        {products.length === 0 ? (
          <div className="py-24 text-center bg-muted/10 border border-dashed rounded-sm flex flex-col items-center justify-center">
            <h3 className="font-serif text-2xl mb-4 text-foreground">No pieces currently available</h3>
            <p className="text-muted-foreground font-light max-w-md mb-8">
              We are currently curating new additions for {category.name}. Check back soon or explore our other collections.
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
              href={`/products?category=${category.id}`}
              className="border border-border text-foreground px-8 py-4 text-xs uppercase tracking-[0.2em] hover:border-foreground transition-colors"
            >
              View All {category.name} Pieces
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
