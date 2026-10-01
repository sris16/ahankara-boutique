import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Feather, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About The Atelier | AHANKARA STUDIOS",
  description: "Explore the philosophy, craftsmanship, and quiet luxury defining AHANKARA STUDIOS collections.",
  openGraph: {
    title: "About The Atelier | AHANKARA STUDIOS",
    description: "Explore the philosophy, craftsmanship, and quiet luxury defining AHANKARA STUDIOS collections.",
    type: "website",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "About The Atelier | AHANKARA STUDIOS",
    description: "Explore the philosophy, craftsmanship, and quiet luxury defining AHANKARA STUDIOS collections.",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24">
      {/* Editorial Hero Header */}
      <section className="relative w-full py-24 md:py-36 border-b border-border/50 bg-surface/30 overflow-hidden">
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-4 block">
            The Atelier & Ethos
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight text-foreground mb-8 leading-[1.05]">
            Mindful Form.<br />Quiet Luxury.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            AHANKARA STUDIOS is an Indian contemporary atelier founded on the principles of reductive elegance, tactile purity, and permanent silhouettes.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-4xl space-y-20">
        {/* The Philosophy */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground block mb-2">01 / Foundation</span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">The Philosophy</h2>
          </div>
          <div className="md:col-span-8 space-y-5 text-sm md:text-base text-muted-foreground font-light leading-relaxed">
            <p>
              In a landscape saturated by fleeting seasonal noise and accelerated consumption, AHANKARA STUDIOS creates pieces designed to endure. We believe that true distinction is found not in ornamental excess, but in the precision of cut, the balance of drape, and the restraint of intentional design.
            </p>
            <p>
              Our collections are conceived as permanent wardrobe foundations. Each silhouette is developed through exhaustive prototyping, refining proportions until the garment feels both effortless and commanding.
            </p>
          </div>
        </section>

        {/* 3 Core Pillars */}
        <section className="pt-8 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground block mb-2">02 / Design Codes</span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-4">Our Three Pillars</h2>
            <p className="text-sm text-muted-foreground font-light">
              Every garment carrying the AHANKARA monogram is governed by three non-negotiable principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 md:p-8 border border-border/60 bg-surface/40 rounded-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center">
                <Compass className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="font-serif text-xl tracking-tight text-foreground">Architectural Silhouette</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Tailored with structured geometric volume that maintains form across movement. Sculptural cuts designed to drape naturally around the human body.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 md:p-8 border border-border/60 bg-surface/40 rounded-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center">
                <Feather className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="font-serif text-xl tracking-tight text-foreground">Tactile Purity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                High-grammage cottons, structured blends, and curated textiles sourced for breathability, hand-feel, and longevity that deepens with wear.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 md:p-8 border border-border/60 bg-surface/40 rounded-sm space-y-4">
              <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border/70 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-foreground" />
              </div>
              <h3 className="font-serif text-xl tracking-tight text-foreground">Mindful Production</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Small-batch releases strictly tied to real demand to eliminate deadstock. Ethical manufacturing partnerships with fair labor practices.
              </p>
            </div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start pt-8 border-t border-border/40">
          <div className="md:col-span-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground block mb-2">03 / Creation</span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">Artisan Craft</h2>
          </div>
          <div className="md:col-span-8 space-y-5 text-sm md:text-base text-muted-foreground font-light leading-relaxed">
            <p>
              We collaborate with master patternmakers and heritage ateliers across India. Reinforcing seam junctions, clean bias finishes, and high-tolerance stitching ensure that an AHANKARA garment outlasts standard seasonal obsolescence.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 border border-border/40 rounded-sm bg-surface/20">
                <ShieldCheck className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Quality Inspection</h4>
                  <p className="text-xs text-muted-foreground">Every piece is verified by hand before consignment packaging.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-border/40 rounded-sm bg-surface/20">
                <ShieldCheck className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-1">Traceable Origins</h4>
                  <p className="text-xs text-muted-foreground">Transparent material provenance across our capsule series.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discovery Callout */}
        <section className="p-8 md:p-14 border border-border/60 bg-surface/50 text-center rounded-sm space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground block">
            Permanent Wardrobe
          </span>
          <h3 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground">
            Experience the Collection
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
            Explore curated drops, signature heavyweight silhouettes, and limited releases.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="uppercase tracking-widest text-xs px-8">
              <Link href="/products" className="gap-2 inline-flex items-center">
                Explore All Products
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="uppercase tracking-widest text-xs px-8">
              <Link href="/contact">
                Atelier Concierge
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
