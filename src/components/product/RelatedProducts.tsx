import { apiClient } from "@/lib/api/client";
import { ProductListResponse } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";

interface RelatedProductsProps {
  categoryId: string;
  currentProductId: string;
}

import { ProductSummary } from "@/types/catalog";

export async function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  let products: ProductSummary[] = [];

  try {
    const res = await apiClient.get<ProductListResponse>("/api/products", {
      params: {
        categoryId,
        limit: 5, // Fetch 5 to ensure we have 4 after filtering current product
      },
      // Using Next.js cache for server components
      next: { revalidate: 3600 }
    });

    if (res && res.data) {
      // Filter out current product and slice to 4
      products = res.data
        .filter((p) => p.id !== currentProductId)
        .slice(0, 4);
    }
  } catch (error) {
    // Graceful failure - do not crash the PDP
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 border-t mt-12" aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="font-serif text-2xl md:text-3xl mb-8">
        You Might Also Like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
