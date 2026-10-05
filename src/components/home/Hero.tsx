import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientGlow } from "@/components/ui/atmosphere";

export function Hero() {
  return (
    <section
      aria-label="AHANKARA STUDIOS Atelier Introduction"
      className="relative min-h-[calc(100vh-5rem)] flex items-center overflow-hidden bg-background py-12 md:py-20 lg:py-24"
    >
      {/* Subtle Atmospheric Light Behind Hero */}
      <AmbientGlow position="top" tone="warm" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-center">
          
          {/* Left Column: Viewport-Scale Editorial Masthead (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center">
            {/* Atelier Eyebrow */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-accent font-medium select-none">
                Autumn / Winter 2026 &mdash; Atelier Edition
              </span>
            </div>

            {/* Master Viewport-Scale Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.75rem] text-foreground tracking-tight leading-[0.95] mb-6 sm:mb-8 text-balance font-normal">
              Form. Silhouette. <br />
              <span className="italic font-light text-foreground/90">Permanence.</span>
            </h1>

            {/* Narrative Subtext */}
            <p className="text-sm sm:text-base md:text-lg text-foreground/80 font-light max-w-xl mb-8 sm:mb-10 leading-relaxed tracking-wide text-balance">
              Mindfully curated contemporary garments designed for the enduring wardrobe.
              Sculpted silhouettes rooted in quiet luxury, architectural drape, and reductive precision.
            </p>

            {/* Action Cluster: Primary Dominant CTA + Secondary Atelier Link */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto uppercase tracking-[0.2em] text-xs px-10 py-6 rounded-xs shadow-subtle hover:shadow-elevated transition-all duration-300 group min-h-[48px]"
              >
                <Link href="/products" className="inline-flex items-center justify-center gap-3">
                  <span>Explore All Silhouettes</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>

              <Link
                href="/about"
                className="inline-flex items-center justify-center text-xs tracking-[0.2em] uppercase font-medium text-foreground/80 hover:text-foreground border-b border-border hover:border-foreground py-2.5 transition-colors duration-200 self-center sm:self-auto"
              >
                <span>Atelier Philosophy &rarr;</span>
              </Link>
            </div>

            {/* Minimal Editorial Archival Metadata */}
            <div className="pt-10 sm:pt-14 mt-6 sm:mt-8 border-t border-border/50 w-full flex items-center gap-6 sm:gap-8 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80">
              <span>01 / Permanent Edition</span>
              <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
              <span>Tailored in India</span>
              <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" />
              <span>Global Dispatch</span>
            </div>
          </div>

          {/* Right Column: Framed Campaign Photography (5 cols) */}
          <div className="lg:col-span-5 relative w-full">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-xs overflow-hidden border border-border/80 bg-surface-muted shadow-elevated group">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                alt="AHANKARA STUDIOS Autumn Atelier Campaign Silhouette"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.03]"
              />

              {/* Discreet Architectural Watermark / Frame Badge */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 px-3 py-1.5 bg-background/90 backdrop-blur-xs border border-border/70 rounded-xs text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/90 select-none shadow-xs">
                Atelier No. 01
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hairline Horizon Seam */}
      <div className="absolute bottom-0 inset-x-0 h-px hairline-fade" aria-hidden="true" />
    </section>
  );
}
