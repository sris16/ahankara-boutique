import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeClosingCta() {
  return (
    <section
      aria-label="Atelier Collection Invitation"
      className="py-24 md:py-32 bg-foreground text-background relative overflow-hidden"
    >
      {/* Subtle radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-4xl text-center">
        <span className="text-[11px] uppercase tracking-[0.3em] font-sans font-medium text-background/60 block mb-6">
          AHANKARA STUDIOS &mdash; Catalog Access
        </span>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-background font-normal tracking-tight leading-[1.08] mb-8 text-balance">
          Designed for a mindful wardrobe. <br className="hidden sm:inline" />
          <span className="italic font-light text-background/90">Experience the collection.</span>
        </h2>

        <p className="text-sm sm:text-base text-background/70 font-light max-w-xl mx-auto mb-10 leading-relaxed text-balance">
          Explore our complete selection of curated garments, designed with architectural
          clarity and produced for timeless longevity.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90 uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-xs transition-all shadow-subtle group"
          >
            <Link href="/products" className="inline-flex items-center justify-center gap-3">
              <span>View All Pieces</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-background/30 hover:border-background text-background hover:bg-background/10 uppercase tracking-[0.2em] text-xs px-8 py-6 rounded-xs transition-colors"
          >
            <Link href="/contact">Client Inquiries &rarr;</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
