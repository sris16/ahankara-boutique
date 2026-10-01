import { ProductService } from "@/server/services/product.service"
import { ProductCard } from "@/components/catalog/ProductCard"
import { ProductSummary } from "@/types/catalog"

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export async function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  let products: ProductSummary[] = []

  try {
    const res = await ProductService.getPublicProducts({
      categoryId,
      limit: 5,
      page: 1,
    })

    if (res && res.data) {
      // Filter out current product and take up to 4
      products = res.data
        .filter((p) => p.id !== currentProductId)
        .slice(0, 4)
    }
  } catch {
    // Graceful failure - do not crash the PDP
    return null
  }

  if (products.length === 0) return null

  return (
    <section className="py-16 sm:py-20 border-t border-border/60 mt-16" aria-labelledby="related-products-heading">
      <div className="flex flex-col items-center text-center mb-10 md:mb-12">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-accent font-medium select-none mb-2">
          Curated Complements
        </span>
        <h2 id="related-products-heading" className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-foreground">
          You May Also Admire
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
