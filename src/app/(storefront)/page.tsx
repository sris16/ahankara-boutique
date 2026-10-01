import { Metadata } from "next";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";
import { ProductSummary } from "@/types/catalog";
import { Hero } from "@/components/home/Hero";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { NewArrivalsSection } from "@/components/home/NewArrivalsSection";
import { EditorialVignette } from "@/components/home/EditorialVignette";
import { CollectionSpotlight } from "@/components/home/CollectionSpotlight";
import { BrandPillars } from "@/components/home/BrandPillars";
import { HomeClosingCta } from "@/components/home/HomeClosingCta";

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "AHANKARA STUDIOS | Premium Fashion",
  description:
    "Discover our curated collection of premium fashion pieces designed for the modern wardrobe. Ahankara Studios.",
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

  const newArrivals = (newArrivalsData?.data || []) as unknown as ProductSummary[];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Cinematic Hero Experience */}
      <Hero />

      {/* 2. Curated Categories Showcase */}
      <CategoryShowcase categories={topCategories} />

      {/* 3. Latest Atelier Additions */}
      <NewArrivalsSection products={newArrivals} />

      {/* 4. Asymmetric Craftsmanship Story */}
      <EditorialVignette />

      {/* 5. Thematic Collections / Studio Catalog Gateway */}
      <CollectionSpotlight collections={featuredCollections} />

      {/* 6. Authentic Studio Pillars */}
      <BrandPillars />

      {/* 7. Closing Atelier Invitation */}
      <HomeClosingCta />
    </div>
  );
}

