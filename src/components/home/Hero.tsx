import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      aria-label="AHANKARA STUDIOS Atelier Introduction"
      className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-surface"
    >
      {/* Background Image Layer with Luxury Scrim */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
          alt="AHANKARA STUDIOS Autumn Atelier Garment Collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-[1.02] transition-transform duration-[2000ms] ease-out motion-reduce:transform-none motion-reduce:transition-none"
        />
        {/* Multilayered Warm Scrim for Maximum Legibility & Atmospheric Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/90" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-background/30 to-background/80" />
      </div>

      {/* Editorial Content Frame */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-20 md:py-28 flex flex-col items-center text-center max-w-4xl">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1 rounded-full bg-surface/80 backdrop-blur-md border border-border/60 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-foreground/90 font-sans">
            AHANKARA STUDIOS &mdash; Atelier Edition
          </span>
        </div>

        {/* Viewport-Scale Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground tracking-tight leading-[0.95] mb-8 text-balance font-normal">
          Form. Silhouette. <br className="hidden sm:inline" />
          <span className="italic font-light">Permanence.</span>
        </h1>

        {/* Narrative Subtext */}
        <p className="text-sm sm:text-base md:text-lg text-foreground/85 max-w-xl mb-10 font-light tracking-wide leading-relaxed text-balance">
          Mindfully curated contemporary garments designed for the modern wardrobe.
          Sculpted silhouettes rooted in quiet luxury and architectural minimalism.
        </p>

        {/* Action Cluster */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto uppercase tracking-[0.2em] text-xs px-9 py-6 rounded-xs shadow-subtle hover:shadow-elevation transition-all duration-300 group"
          >
            <Link href="/products" className="inline-flex items-center justify-center gap-3">
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>

          <Link
            href="/about"
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs tracking-[0.2em] uppercase font-medium text-foreground/80 hover:text-foreground border-b border-foreground/30 hover:border-foreground py-2.5 transition-colors duration-200"
          >
            Atelier Philosophy &rarr;
          </Link>
        </div>
      </div>

      {/* Subtle Bottom Horizon Line */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
