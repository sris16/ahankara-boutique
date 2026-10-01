import Link from "next/link";
import { ProductSummary } from "@/types/catalog";
import { ProductCard } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkles, ArrowRight } from "lucide-react";

interface NewArrivalsSectionProps {
  products: ProductSummary[];
}

export function NewArrivalsSection({ products }: NewArrivalsSectionProps) {
  const hasProducts = products && products.length > 0;

  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className="py-20 md:py-32 px-4 sm:px-6 container mx-auto border-t border-border/40"
    >
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 md:mb-16 gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-accent block mb-2 font-sans flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Latest Atelier Arrivals</span>
          </span>
          <h2
            id="new-arrivals-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground"
          >
            New Additions
          </h2>
        </div>

        <Link
          href="/products?sortBy=newest"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-foreground hover:text-accent border-b border-foreground/30 hover:border-accent pb-1 transition-colors self-start sm:self-auto"
        >
          <span>View All Pieces</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Product Display or Phase 2 Empty State */}
      {hasProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-12 max-w-xl mx-auto">
          <EmptyState
            title="Atelier Restock in Progress"
            description="Our latest arrivals are currently being archived and prepared. Discover our existing pieces in the primary catalog."
            action={{
              label: "Explore Catalog",
              href: "/products",
            }}
          />
        </div>
      )}
    </section>
  );
}
