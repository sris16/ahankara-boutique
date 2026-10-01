"use client"

import * as React from "react"
import { apiClient } from "@/lib/api/client"
import { ProductDetail } from "@/types/catalog"
import { ProductCard } from "@/components/catalog/ProductCard"

interface RecentlyViewedProps {
  currentProductSlug: string
}

const STORAGE_KEY = "ahankara_recently_viewed"
const MAX_ITEMS = 5

export function RecentlyViewed({ currentProductSlug }: RecentlyViewedProps) {
  const [products, setProducts] = React.useState<ProductDetail[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    let slugs: string[] = []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        slugs = JSON.parse(stored)
        if (!Array.isArray(slugs)) slugs = []
      }
    } catch {
      slugs = []
    }

    // Add current product to history
    slugs = [currentProductSlug, ...slugs.filter((s) => s !== currentProductSlug)].slice(0, MAX_ITEMS)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
    } catch {
      // Ignore quota/private mode errors
    }

    // Hydrate previous products (excluding current product)
    const historySlugs = slugs.filter((s) => s !== currentProductSlug)

    if (historySlugs.length > 0) {
      Promise.allSettled(
        historySlugs.map((slug) => apiClient.get<ProductDetail>(`/api/products/${slug}`))
      ).then((results) => {
        const fetchedProducts = results
          .filter((r): r is PromiseFulfilledResult<ProductDetail> => r.status === "fulfilled" && !!r.value)
          .map((r) => r.value)
        setProducts(fetchedProducts)
        setMounted(true)
      })
    } else {
      setTimeout(() => setMounted(true), 0)
    }
  }, [currentProductSlug])

  if (!mounted || products.length === 0) return null

  return (
    <section className="py-14 sm:py-16 border-t border-border/60 mt-14" aria-labelledby="recently-viewed-heading">
      <div className="flex flex-col items-center text-center mb-8 md:mb-10">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent font-medium select-none mb-1.5">
          Atelier History
        </span>
        <h2 id="recently-viewed-heading" className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
          Recently Admired
        </h2>
      </div>

      {/* Horizontal smooth snap scroll on mobile, responsive grid on desktop */}
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 md:grid md:grid-cols-4 gap-4 sm:gap-6 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
        {products.map((product) => (
          <div key={product.id} className="min-w-[65vw] sm:min-w-[45vw] md:min-w-0 snap-start flex-none md:flex-1">
            <ProductCard
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                shortDescription: product.shortDescription,
                basePrice: product.basePrice,
                compareAtPrice: product.compareAtPrice,
                categoryId: product.categoryId,
                isFeatured: product.isFeatured,
                hasAvailableStock: product.variants.some((v) => v.available),
                category: product.category,
                collections: product.collections,
                images: product.images,
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
