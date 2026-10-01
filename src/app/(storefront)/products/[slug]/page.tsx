import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { env } from "@/utils/env"

import { ProductService } from "@/server/services/product.service"
import { ProductDetail } from "@/types/catalog"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductForm } from "@/components/product/ProductForm"
import { ProductJsonLd } from "@/components/product/ProductJsonLd"
import { ProductShareButton } from "@/components/product/ProductShareButton"
import { ProductDetailsTabs } from "@/components/product/ProductDetailsTabs"
import { RelatedProducts } from "@/components/product/RelatedProducts"
import { RecentlyViewed } from "@/components/product/RecentlyViewed"
import { Suspense } from "react"
import { ProductCardSkeleton } from "@/components/catalog/ProductCard"

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return (await ProductService.getProductBySlug(slug, true)) as unknown as ProductDetail
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: "Not Found | AHANKARA STUDIOS",
    }
  }

  let baseUrl = env.BETTER_AUTH_URL
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com"
  }

  const canonicalUrl = `${baseUrl}/products/${product.slug}`

  return {
    title: `${product.name} | AHANKARA STUDIOS`,
    description:
      product.shortDescription ||
      product.description?.substring(0, 160) ||
      `Buy ${product.name} at AHANKARA STUDIOS.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.name,
      url: canonicalUrl,
      images: product.images.length > 0 ? [{ url: product.images[0].secureUrl }] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Ensure stock calculation matches ProductList format (any available variant)
  const hasAvailableStock = product.variants.some((v) => v.available)
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]
  const activeCollection = product.collections?.[0]?.collection

  return (
    <>
      <ProductJsonLd product={product} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-7xl">
        {/* Minimalist Atelier Breadcrumbs */}
        <nav
          className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 md:mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar py-1"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-foreground transition-colors shrink-0">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-foreground transition-colors shrink-0"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-xs shrink-0">
            {product.name}
          </span>
        </nav>

        {/* 2-Column Desktop Sticky Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Editorial Gallery (7 columns on large displays) */}
          <div className="lg:col-span-7 w-full">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Product Purchasing Panel (5 columns, sticky on large screens) */}
          <div className="lg:col-span-5 w-full flex flex-col gap-6 lg:sticky lg:top-24">
            {/* Title & Collection Eyebrow */}
            <div className="flex flex-col gap-2 border-b border-border/40 pb-5">
              {activeCollection && (
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-accent">
                  {activeCollection.name}
                </span>
              )}

              <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.65rem] font-normal leading-[1.12] text-foreground tracking-tight">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed mt-1">
                  {product.shortDescription}
                </p>
              )}

              <div className="pt-2">
                <ProductShareButton productName={product.name} />
              </div>
            </div>

            {/* Purchasing Form (Variants, Quantity, Delivery, CTAs) */}
            <ProductForm
              productId={product.id}
              productName={product.name}
              imageUrl={primaryImage?.secureUrl}
              basePrice={product.basePrice}
              compareAtPrice={product.compareAtPrice}
              variants={product.variants}
              hasAvailableStock={hasAvailableStock}
            />

            {/* Information Tabs (Story, Details, Care, Shipping) */}
            <ProductDetailsTabs
              description={product.description}
              shortDescription={product.shortDescription}
              categoryName={product.category.name}
              productId={product.id}
            />
          </div>
        </div>

        {/* History & Complementary Recommendations */}
        <RecentlyViewed currentProductSlug={product.slug} />

        <Suspense
          fallback={
            <div className="py-16 border-t border-border/60 mt-16 animate-pulse">
              <div className="h-6 bg-surface-muted w-48 mb-8 rounded-xs mx-auto" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </div>
            </div>
          }
        >
          <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
        </Suspense>
      </div>
    </>
  )
}
