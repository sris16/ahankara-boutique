import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function EditorialVignette() {
  return (
    <section
      aria-labelledby="editorial-vignette-heading"
      className="py-20 md:py-32 bg-surface-muted/50 border-y border-border/40 overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Asymmetric Image Showcase (5 of 12 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-xs overflow-hidden border border-border/60 shadow-subtle group">
              <Image
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop"
                alt="AHANKARA STUDIOS atelier fabric and silhouette craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </div>

            {/* Floating Editorial Annotation Card */}
            <div className="hidden sm:block absolute -bottom-6 -right-6 p-4 bg-surface border border-border/80 rounded-xs shadow-elevation max-w-[200px]">
              <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold block mb-1">
                Atelier Archive
              </span>
              <p className="text-xs text-foreground/80 font-serif leading-snug">
                Architectural drape &amp; tactile restraint.
              </p>
            </div>
          </div>

          {/* Narrative Column (7 of 12 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start lg:pl-6">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-surface border border-border/60">
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-accent font-sans">
                Atelier Philosophy
              </span>
            </div>

            <h2
              id="editorial-vignette-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight leading-[1.1] mb-6"
            >
              Crafted for those who appreciate the quiet luxury of mindful design.
            </h2>

            <div className="space-y-4 text-foreground/80 font-light text-sm sm:text-base leading-relaxed max-w-xl mb-8">
              <p>
                AHANKARA STUDIOS is built on the discipline of less, but better. We design
                wardrobe staples that endure beyond ephemeral seasonal cycles&mdash;guided by
                uncompromising tailoring, architectural lines, and honest materiality.
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Each silhouette is considered not merely as a garment, but as an enduring aesthetic
                investment in daily composure and lasting form.
              </p>
            </div>

            <Link
              href="/about"
              className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-medium text-foreground hover:text-accent border-b border-foreground/40 hover:border-accent pb-1.5 transition-colors"
            >
              <span>Explore The Studio</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
