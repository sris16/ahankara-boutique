export interface LookbookImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

// -----------------------------------------------------------------------------
// EDITORIAL CONTENT CONFIGURATION
// Note: All images are Unsplash placeholders formatted for high-resolution
// editorial presentation. They should be replaced with real AHANKARA STUDIOS
// campaign photography before production launch.
// -----------------------------------------------------------------------------
export const lookbookData = {
  meta: {
    title: "Editorial Campaign | AHANKARA STUDIOS",
    description: "Explore the latest editorial campaign from AHANKARA STUDIOS. A study in architectural silhouettes, tactile purity, and quiet luxury.",
  },
  hero: {
    image: {
      src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
      alt: "Model wearing AHANKARA STUDIOS architectural silhouette",
    },
    eyebrow: "Autumn / Winter 2026",
    headline: "The Architecture\nof Restraint",
    subtext: "A visual essay on modern form, permanent silhouettes, and the quiet luxury of mindful tailoring.",
  },
  narrative1: {
    headline: "Form Follows Intention",
    body: "In a landscape saturated by noise, true luxury is found in subtraction. The Autumn/Winter campaign strips away the superfluous, leaving only what is essential: the precision of the cut, the integrity of the drape, and the weight of the fabric against the body.",
    image: {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1470&auto=format&fit=crop",
      alt: "Full body minimalist fashion editorial shot in neutral environment",
    },
  },
  gallery1: {
    images: [
      {
        src: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1471&auto=format&fit=crop",
        alt: "Studio shot highlighting structured shoulders",
      },
      {
        src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
        alt: "Model in motion showcasing fabric fluidity",
      },
    ],
    caption: "The tension between geometric structure and fluid movement.",
  },
  narrative2: {
    headline: "Tactile Permanence",
    body: "Every garment in the collection is constructed from high-grammage textiles engineered to age gracefully. We collaborate closely with heritage mills to develop fabrics that possess both structural memory and breathable softness—pieces designed not merely for a season, but for a lifetime of wear.",
  },
  commerceHighlight: {
    image: {
      src: "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1470&auto=format&fit=crop",
      alt: "Signature AHANKARA collection pieces",
    },
    headline: "The Foundation Collection",
    subtext: "Experience the tactile reality of the campaign. Discover the foundational pieces that define the AHANKARA STUDIOS aesthetic.",
    ctaText: "Explore The Collection",
    ctaLink: "/products",
  }
};
