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
import { Suspense } from "react";
import { LocalErrorBoundary } from "@/components/ui/local-error-boundary";

export const revalidate = 60; // Revalidate every minute to keep inventory badges fresh

export const metadata: Metadata = {
  title: "AHANKARA STUDIOS | Premium Editorial Fashion",
  description:
    "Discover our curated collection of premium fashion pieces designed for the modern wardrobe. Architectural silhouettes and quiet luxury by Ahankara Studios.",
  alternates: {
    canonical: "https://ahankarastudios.com",
  },
  openGraph: {
    type: "website",
    url: "https://ahankarastudios.com",
    title: "AHANKARA STUDIOS | Premium Editorial Fashion",
    description: "Architectural silhouettes and quiet luxury by Ahankara Studios.",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AHANKARA STUDIOS | Premium Editorial Fashion",
    description: "Architectural silhouettes and quiet luxury by Ahankara Studios.",
  },
};

async function AsyncCategoryShowcase() {
  const tree = await CategoryService.getCategoryTree(true);
  const topCategories = tree.slice(0, 4);
  return <CategoryShowcase categories={topCategories} />;
}

async function AsyncNewArrivals() {
  const newArrivalsData = await ProductService.getPublicProducts({ sortBy: "newest", limit: 4, page: 1 });
  const newArrivals = (newArrivalsData?.data || []) as unknown as ProductSummary[];
  return <NewArrivalsSection products={newArrivals} />;
}

async function AsyncCollectionSpotlight() {
  const featuredCollections = await CollectionService.getCollections(true, true);
  return <CollectionSpotlight collections={featuredCollections} />;
}

export default function StorefrontHomepage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Cinematic Hero Experience */}
      <Hero />

      {/* 2. Curated Categories Showcase */}
      <LocalErrorBoundary title="Categories unavailable">
        <Suspense fallback={<div className="h-64 sm:h-96 w-full animate-pulse bg-muted/10" />}>
          <AsyncCategoryShowcase />
        </Suspense>
      </LocalErrorBoundary>

      {/* 3. Latest Atelier Additions */}
      <LocalErrorBoundary title="New arrivals unavailable">
        <Suspense fallback={<div className="h-64 sm:h-96 w-full animate-pulse bg-muted/10" />}>
          <AsyncNewArrivals />
        </Suspense>
      </LocalErrorBoundary>

      {/* 4. Asymmetric Craftsmanship Story */}
      <EditorialVignette />

      {/* 5. Thematic Collections / Studio Catalog Gateway */}
      <LocalErrorBoundary title="Collections unavailable">
        <Suspense fallback={<div className="h-64 sm:h-96 w-full animate-pulse bg-muted/10" />}>
          <AsyncCollectionSpotlight />
        </Suspense>
      </LocalErrorBoundary>

      {/* 6. Authentic Studio Pillars */}
      <BrandPillars />

      {/* 7. Closing Atelier Invitation */}
      <HomeClosingCta />
    </div>
  );
}

