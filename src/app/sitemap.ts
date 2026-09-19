import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { env } from "@/utils/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    // 1. Fetch public products
    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        category: { isActive: true },
      },
      select: { slug: true, updatedAt: true },
      // limit to prevent massive payload if catalog grows huge
      // Note: for a massive catalog, Next.js supports generateSitemaps (chunking),
      // but 10,000 is perfectly fine for a single sitemap file right now.
      take: 10000,
    });

    products.forEach((product) => {
      routes.push({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // Categories and Collections do not have dedicated canonical public routes.
    // They are only accessed via query parameters on /products (e.g. /products?category=...),
    // which should not be indexed in the sitemap.

  } catch (error) {
    console.error("Failed to generate complete sitemap", error);
    // Graceful failure: at least return the base routes
  }

  return routes;
}
