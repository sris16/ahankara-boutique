import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ArrowRight } from "lucide-react";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";
import { ProductSummary } from "@/types/catalog";

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "AHANKARA STUDIOS | Premium Fashion",
  description: "Discover our curated collection of premium fashion pieces designed for the modern wardrobe. Ahankara Studios.",
};

async function getFeaturedCollections() {
  try {
    return await CollectionService.getCollections(true, true);
  } catch (error) {
    console.error("Failed to fetch featured collections", error);
    return [];
  }
}

async function getTopCategories() {
  try {
    const tree = await CategoryService.getCategoryTree(true);
    return tree.slice(0, 4); // Limit to top 4 for the homepage discovery
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return [];
  }
}

async function getNewArrivals() {
  try {
    return await ProductService.getPublicProducts({ sortBy: "newest", limit: 4, page: 1 });
  } catch (error) {
    console.error("Failed to fetch new arrivals", error);
    return null;
  }
}

export default async function StorefrontHomepage() {
  const [featuredCollections, topCategories, newArrivalsData] = await Promise.all([
    getFeaturedCollections(),
    getTopCategories(),
    getNewArrivals(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-brand-50">
        <div className="absolute inset-0 opacity-40 mix-blend-multiply">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Ahankara Studios Collection"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
          <span className="uppercase tracking-[0.4em] text-xs font-medium mb-6 text-foreground/80">
            The New Standard
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 text-foreground tracking-tight leading-none">
            Elegance <br className="hidden md:block" /> Redefined
          </h1>
          <p className="text-base md:text-lg text-foreground/80 mb-10 max-w-lg font-light tracking-wide leading-relaxed">
            Discover our curated collection of premium fashion pieces designed for the modern wardrobe.
          </p>
          <Link
            href="/products"
            className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-foreground/90 transition-all duration-300"
          >
            Explore the Collection
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-24 md:py-32 px-4 container mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="font-serif text-3xl md:text-5xl mb-4">Featured Collections</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-xs md:text-sm">Curated stories</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto">
            {featuredCollections.slice(0, 2).map((collection) => (
              <Link 
                key={collection.id} 
                href={`/collections/${collection.slug}`}
                className="group relative aspect-[4/5] md:aspect-square overflow-hidden bg-secondary flex items-end p-8 md:p-12"
              >
                {collection.imageUrl ? (
                  <Image
                    src={collection.imageUrl}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
                
                <div className="relative z-10 text-white w-full">
                  <h3 className="font-serif text-3xl md:text-4xl mb-3 group-hover:text-white/80 transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-2 max-w-sm mb-6 font-light leading-relaxed">
                    {collection.description || "Explore this collection."}
                  </p>
                  <span className="text-[10px] tracking-[0.2em] uppercase font-medium border-b border-white/50 pb-1 group-hover:border-white transition-colors">
                    Shop Now
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Discovery */}
      {topCategories.length > 0 && (
        <section className="py-24 bg-muted/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl md:text-4xl mb-16">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-8 max-w-5xl mx-auto">
              {topCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col items-center relative"
                >
                  <span className="absolute inset-0 z-10" aria-hidden="true"></span>
                  <div className="w-36 h-36 md:w-52 md:h-52 rounded-full overflow-hidden bg-secondary mb-6 relative">
                    {category.imageUrl ? (
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 144px, 208px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-brand-100">
                        <span className="text-[10px] uppercase tracking-widest text-center px-4">
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-serif text-lg md:text-xl group-hover:text-muted-foreground transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-24 md:py-32 px-4 container mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16 gap-6 text-center md:text-left">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">New Arrivals</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-xs md:text-sm">Latest additions to the studio</p>
          </div>
          <Link 
            href="/products?sortBy=newest" 
            className="text-xs font-medium hover:text-muted-foreground transition-colors border-b border-foreground/50 hover:border-foreground pb-1 uppercase tracking-[0.2em]"
          >
            View All
          </Link>
        </div>

        {newArrivalsData?.data && newArrivalsData.data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-x-8 md:gap-y-12">
            {newArrivalsData.data.map((product) => (
              <ProductCard key={product.id} product={product as unknown as ProductSummary} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-muted/10 border border-dashed rounded-sm">
            <p className="text-muted-foreground font-light">No pieces are currently available.</p>
          </div>
        )}
      </section>

      {/* Editorial / Brand Story */}
      <section className="py-32 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl mb-10 leading-tight">
            Crafted for those who appreciate the quiet luxury of mindful design.
          </h2>
          <p className="text-background/70 text-base md:text-lg font-light mb-16 max-w-2xl mx-auto leading-relaxed">
            Ahankara Studios is built on the philosophy of less, but better. We curate fashion that endures beyond seasonal trends, focusing on impeccable fit, sustainable practices, and timeless aesthetics.
          </p>
          <Link 
            href="/products" 
            className="inline-block border border-background/30 hover:border-background text-background px-10 py-4 text-xs uppercase tracking-[0.2em] transition-colors"
          >
            Discover More
          </Link>
        </div>
      </section>
    </div>
  );
}
