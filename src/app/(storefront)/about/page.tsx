import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | AHANKARA STUDIOS",
  description: "Learn about the philosophy, design, and craftsmanship behind AHANKARA STUDIOS.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Editorial Hero */}
      <section className="relative w-full h-[60vh] md:h-[70vh] bg-muted/20 flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1550614000-4b95d466f288?q=80&w=2070&auto=format&fit=crop"
          alt="Ahankara Studios Workshop"
          fill
          priority
          className="object-cover object-center opacity-80"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 text-white">
            Our Story
          </h1>
          <p className="text-base md:text-lg max-w-2xl font-light leading-relaxed text-white/90">
            Crafted for those who appreciate the quiet luxury of mindful design.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
        <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none text-center md:text-left">

          <h2 className="font-serif text-3xl tracking-tight mb-6">The Philosophy</h2>
          <p className="font-light leading-relaxed text-muted-foreground mb-12">
            Ahankara Studios is built on the philosophy of less, but better. We curate fashion that endures beyond seasonal trends, focusing on impeccable fit, sustainable practices, and timeless aesthetics. Our pieces are designed to be the foundation of a modern, sophisticated wardrobe.
          </p>

          <h2 className="font-serif text-3xl tracking-tight mb-6">Design & Craftsmanship</h2>
          <p className="font-light leading-relaxed text-muted-foreground mb-12">
            Every piece in our collection is the result of rigorous design iteration and uncompromising attention to detail. We work closely with skilled artisans and carefully select premium materials that age beautifully over time.
          </p>

          <div className="my-16 border-t border-b py-12 text-center">
            <h3 className="font-serif text-2xl tracking-tight mb-4 text-foreground">
              Discover the Collection
            </h3>
            <p className="font-light text-muted-foreground mb-8 max-w-md mx-auto">
              Explore our latest arrivals and signature pieces.
            </p>
            <Link
              href="/products"
              className="inline-block border border-foreground text-foreground px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
