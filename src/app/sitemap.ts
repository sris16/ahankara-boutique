import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { env } from "@/utils/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }

  // Base and static informational routes
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
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
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

    // 2. Fetch active categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    categories.forEach((category) => {
      routes.push({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

    // 3. Fetch active collections
    const collections = await prisma.collection.findMany({
      where: {
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } }
            ]
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: new Date() } }
            ]
          }
        ]
      },
      select: { slug: true, updatedAt: true },
    });

    collections.forEach((collection) => {
      routes.push({
        url: `${baseUrl}/collections/${collection.slug}`,
        lastModified: collection.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });

  } catch (error) {
    console.error("Failed to generate complete sitemap", error);
    // Graceful failure: at least return the base routes
  }

  return routes;
}
