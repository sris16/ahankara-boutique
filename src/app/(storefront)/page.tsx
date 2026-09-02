import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { apiClient } from "@/lib/api/client";
import { ProductListResponse, Collection, CategoryTree } from "@/types/catalog";
import { ArrowRight } from "lucide-react";

async function getFeaturedCollections() {
  try {
    return await apiClient.get<Collection[]>("/api/collections", { params: { featured: true } });
  } catch (error) {
    console.error("Failed to fetch featured collections", error);
    return [];
  }
}

async function getTopCategories() {
  try {
    const tree = await apiClient.get<CategoryTree[]>("/api/categories", { params: { tree: true } });
    return tree.slice(0, 4); // Limit to top 4 for the homepage discovery
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return [];
  }
}

async function getNewArrivals() {
  try {
    return await apiClient.get<ProductListResponse>("/api/products", { params: { sortBy: "newest", limit: 4 } });
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
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-brand-50">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-multiply" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
          <span className="uppercase tracking-[0.3em] text-sm font-medium mb-4 text-foreground/80">
            The New Standard
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 text-foreground tracking-tight">
            Elegance <br className="hidden md:block" /> Redefined
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-xl font-light">
            Discover our curated collection of premium fashion pieces designed for the modern wardrobe.
          </p>
          <Link
            href="/products"
            className="group inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-sm tracking-widest uppercase hover:bg-foreground/90 transition-all duration-300"
          >
            Explore the Collection
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-20 md:py-32 px-4 container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Featured Collections</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-sm">Curated stories</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {featuredCollections.slice(0, 2).map((collection) => (
              <Link 
                key={collection.id} 
                href={`/products?collection=${collection.slug}`}
                className="group relative aspect-[4/5] md:aspect-square overflow-hidden bg-secondary flex items-end p-8"
              >
                {collection.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.imageUrl}
                    alt={collection.name}
                    className="absolute inset-0 object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                
                <div className="relative z-10 text-white">
                  <h3 className="font-serif text-2xl md:text-3xl mb-2 group-hover:underline decoration-1 underline-offset-4">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-white/80 line-clamp-2 max-w-sm mb-4">
                    {collection.description || "Explore this collection."}
                  </p>
                  <span className="text-xs tracking-[0.2em] uppercase font-medium border-b border-white pb-1">
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
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl mb-12">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
              {topCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group flex flex-col items-center"
                >
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-secondary mb-6 relative">
                    {category.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground transition-colors group-hover:bg-brand-200">
                        <span className="text-[10px] uppercase tracking-widest text-center px-4">
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm tracking-widest uppercase group-hover:text-muted-foreground transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-20 md:py-32 px-4 container mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">New Arrivals</h2>
            <p className="text-muted-foreground uppercase tracking-widest text-sm">Latest additions to the studio</p>
          </div>
          <Link 
            href="/products?sortBy=newest" 
            className="text-sm font-medium hover:text-muted-foreground transition-colors border-b border-foreground pb-1 uppercase tracking-widest"
          >
            View All
          </Link>
        </div>

        {newArrivalsData?.data && newArrivalsData.data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {newArrivalsData.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-muted/20 border border-dashed rounded-sm">
            <p className="text-muted-foreground">No pieces are currently available.</p>
          </div>
        )}
      </section>

      {/* Editorial / Brand Story */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="font-serif text-3xl md:text-5xl mb-8 leading-tight">
            Crafted for those who appreciate the quiet luxury of mindful design.
          </h2>
          <p className="text-background/70 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto">
            Ahankara Studios is built on the philosophy of less, but better. We curate fashion that endures beyond seasonal trends, focusing on impeccable fit, sustainable practices, and timeless aesthetics.
          </p>
          <Link 
            href="/products" 
            className="inline-block border border-background/30 hover:border-background text-background px-8 py-3 text-sm uppercase tracking-widest transition-colors"
          >
            Discover More
          </Link>
        </div>
      </section>
    </div>
  );
}
