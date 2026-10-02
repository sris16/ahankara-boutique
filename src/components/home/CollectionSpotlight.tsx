import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  description?: string | null;
}

interface CollectionSpotlightProps {
  collections: CollectionItem[];
}

export function CollectionSpotlight({ collections }: CollectionSpotlightProps) {
  // If real collections exist, display them in an editorial presentation
  if (collections && collections.length > 0) {
    return (
      <section
        aria-labelledby="collection-spotlight-heading"
        className="py-20 md:py-32 px-4 sm:px-6 container mx-auto"
      >
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-accent block mb-2 font-sans">
            Curated Stories
          </span>
          <h2
            id="collection-spotlight-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground"
          >
            Featured Collections
          </h2>
          <p className="text-sm text-muted-foreground font-light mt-3">
            Explore dedicated thematic chapters from our atelier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-6xl mx-auto">
          {collections.slice(0, 2).map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="group relative aspect-[4/5] sm:aspect-[16/11] rounded-xs overflow-hidden bg-surface-muted border border-border/60 flex items-end p-8 md:p-12 shadow-subtle hover:shadow-elevation transition-all duration-500"
            >
              {col.imageUrl ? (
                <Image
                  src={col.imageUrl}
                  alt={col.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-surface-muted" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-85 transition-opacity group-hover:opacity-95" />

              <div className="relative z-10 text-white w-full">
                <span className="text-[10px] tracking-[0.25em] uppercase font-sans text-white/70 block mb-2">
                  Atelier Chapter
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-3 group-hover:text-white/90 transition-colors">
                  {col.name}
                </h3>
                {col.description && (
                  <p className="text-xs sm:text-sm text-white/80 line-clamp-2 max-w-md mb-6 font-light leading-relaxed">
                    {col.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-medium border-b border-white/40 pb-1 group-hover:border-white transition-colors">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  // Graceful fallback when 0 collections exist in DB:
  // Render a legitimate "Studio Editions & Catalog Gateway" linking to real routes
  return (
    <section
      aria-labelledby="catalog-gateway-heading"
      className="py-20 md:py-28 px-4 sm:px-6 container mx-auto"
    >
      <div className="relative rounded-xs overflow-hidden border border-border/60 bg-gradient-to-r from-surface to-brand-50/50 p-8 sm:p-12 md:p-16 max-w-6xl mx-auto shadow-xs">
        <div className="max-w-2xl">
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-accent block mb-3 font-sans">
            Curated Catalog
          </span>
          <h2
            id="catalog-gateway-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight mb-4"
          >
            Studio Foundations
          </h2>
          <p className="text-sm sm:text-base text-foreground/80 font-light leading-relaxed mb-8">
            Explore our foundational wardrobe pieces. From structured outer layers to relaxed
            minimalist essentials, our pieces are cut with precision and made to endure.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="default"
              className="uppercase tracking-[0.2em] text-xs px-8 py-5 rounded-xs"
            >
              <Link href="/products" className="inline-flex items-center gap-2">
                <span>View Complete Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Link
              href="/products?sortBy=newest"
              className="text-xs uppercase tracking-[0.2em] font-medium text-foreground hover:text-accent border-b border-foreground/30 hover:border-accent pb-1 transition-colors"
            >
              Sort by Newest &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
