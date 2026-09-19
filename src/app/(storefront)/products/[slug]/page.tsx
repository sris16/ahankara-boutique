import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { env } from "@/utils/env";

import { apiClient } from "@/lib/api/client";
import { ProductDetail } from "@/types/catalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductForm } from "@/components/product/ProductForm";
import { ProductJsonLd } from "@/components/product/ProductJsonLd";
import { ProductShareButton } from "@/components/product/ProductShareButton";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Suspense } from "react";
import { ProductCardSkeleton } from "@/components/catalog/ProductCard";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProduct(slug: string) {
  try {
    const res = await apiClient.get<ProductDetail>(`/api/products/${slug}`);
    return res;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Not Found | AHANKARA STUDIOS",
    };
  }

  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }

  const canonicalUrl = `${baseUrl}/products/${product.slug}`;

  return {
    title: `${product.name} | AHANKARA STUDIOS`,
    description: product.shortDescription || product.description?.substring(0, 160) || `Buy ${product.name} at AHANKARA STUDIOS.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      url: canonicalUrl,
      images: product.images.length > 0 ? [{ url: product.images[0].secureUrl }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Ensure stock calculation matches ProductList format (any available variant)
  const hasAvailableStock = product.variants.some((v) => v.available);

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/products?category=${product.categoryId}`} className="hover:text-foreground transition-colors">
          {product.category.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: Gallery */}
        <div className="w-full lg:w-3/5">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Info & Actions */}
        <div className="w-full lg:w-2/5 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-3xl md:text-4xl leading-tight">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="text-muted-foreground text-lg">
                {product.shortDescription}
              </p>
            )}
            <ProductShareButton productName={product.name} />
          </div>

          <ProductForm
            productId={product.id}
            basePrice={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            variants={product.variants}
            hasAvailableStock={hasAvailableStock}
          />

          {/* Product Description */}
          {product.description && (
            <div className="pt-8 border-t">
              <h2 className="text-sm font-medium tracking-widest uppercase mb-4">Details</h2>
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <RecentlyViewed currentProductSlug={product.slug} />

      <Suspense fallback={
        <div className="py-16 border-t mt-12 animate-pulse">
          <div className="h-8 bg-secondary w-1/4 mb-8 rounded-sm" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </div>
      }>
        <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
      </Suspense>
    </div>
    </>
  );
}
