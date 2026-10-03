import { Metadata } from "next";
import { lookbookData } from "@/components/editorial/lookbook-data";
import { LookbookHero } from "@/components/editorial/LookbookHero";
import { LookbookNarrative } from "@/components/editorial/LookbookNarrative";
import { LookbookAsymmetricGallery } from "@/components/editorial/LookbookAsymmetricGallery";
import { LookbookCommerceHighlight } from "@/components/editorial/LookbookCommerceHighlight";

// SEO and Metadata matching the C14 standards
export const metadata: Metadata = {
  title: lookbookData.meta.title,
  description: lookbookData.meta.description,
  openGraph: {
    title: lookbookData.meta.title,
    description: lookbookData.meta.description,
    type: "website",
    siteName: "AHANKARA STUDIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: lookbookData.meta.title,
    description: lookbookData.meta.description,
  },
};

export default function LookbookPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden selection:bg-accent/20">

      {/* 1. Cinematic Hero */}
      <LookbookHero
        image={lookbookData.hero.image}
        eyebrow={lookbookData.hero.eyebrow}
        headline={lookbookData.hero.headline}
        subtext={lookbookData.hero.subtext}
      />

      {/* 2. Opening Editorial Statement */}
      <LookbookNarrative
        headline={lookbookData.narrative1.headline}
        body={lookbookData.narrative1.body}
        image={lookbookData.narrative1.image}
        align="left"
      />

      {/* 3. Asymmetric Gallery */}
      <LookbookAsymmetricGallery
        images={lookbookData.gallery1.images}
        caption={lookbookData.gallery1.caption}
      />

      {/* 4. Secondary Statement (Text Only, Centered) */}
      <LookbookNarrative
        headline={lookbookData.narrative2.headline}
        body={lookbookData.narrative2.body}
        align="center"
      />

      {/* 5. Commerce Highlight (Bridge to Catalog) */}
      <LookbookCommerceHighlight
        image={lookbookData.commerceHighlight.image}
        headline={lookbookData.commerceHighlight.headline}
        subtext={lookbookData.commerceHighlight.subtext}
        ctaText={lookbookData.commerceHighlight.ctaText}
        ctaLink={lookbookData.commerceHighlight.ctaLink}
      />

    </div>
  );
}
