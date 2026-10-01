import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface CategoryShowcaseProps {
  categories: CategoryItem[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="category-showcase-heading"
      className="py-20 md:py-32 px-4 sm:px-6 container mx-auto"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium text-accent block mb-2 font-sans">
            Curated Silhouettes
          </span>
          <h2
            id="category-showcase-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground"
          >
            Shop by Category
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-light max-w-sm">
          Carefully tailored garments structured around timeless form, functional comfort, and mindful materiality.
        </p>
      </div>

      {/* Editorial Rectangular Grid (replacing circular avatars) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative aspect-[4/5] rounded-xs overflow-hidden bg-surface-muted border border-border/60 flex flex-col justify-end p-5 sm:p-7 shadow-xs hover:shadow-subtle transition-all duration-500"
          >
            {category.imageUrl ? (
              <>
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                
                {/* Overlay Content */}
                <div className="relative z-10 text-white flex flex-col gap-1 w-full">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-sans text-white/70">
                    Category
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg sm:text-2xl font-normal tracking-wide group-hover:translate-x-0.5 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all duration-300">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* High-End Architectural Monogram Fallback when category has no image */
              <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-br from-surface to-brand-50/50 border border-border/40">
                <div className="flex items-start justify-between">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border/60 opacity-60">
                    <Image
                      src="/images/brand/ahankara-studios-logo.jpg"
                      alt="AHANKARA STUDIOS"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-sans font-medium">
                    Atelier Series
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground tracking-tight group-hover:text-accent transition-colors duration-200">
                    {category.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-light mt-1 flex items-center gap-1 group-hover:underline">
                    Explore Silhouettes &rarr;
                  </span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
