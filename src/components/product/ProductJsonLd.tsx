import { ProductDetail } from "@/types/catalog";
import { env } from "@/utils/env";

export function ProductJsonLd({ product }: { product: ProductDetail }) {
  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }

  // Get authoritative first variant for SKU if it exists
  const firstVariant = product.variants?.[0];

  // Calculate price in rupees
  const priceInRupees = (product.basePrice / 100).toFixed(2);

  // Availability mapping
  const hasAvailableStock = product.variants.some((v) => v.available);
  const availability = hasAvailableStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.shortDescription || product.description || `Buy ${product.name} at AHANKARA STUDIOS`,
    ...(primaryImage && { "image": primaryImage.secureUrl }),
    ...(firstVariant?.id && { "sku": firstVariant.id }),
    "brand": {
      "@type": "Brand",
      "name": "AHANKARA STUDIOS"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": priceInRupees,
      "availability": availability
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
