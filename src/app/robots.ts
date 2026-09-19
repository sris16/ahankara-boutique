import { MetadataRoute } from "next";
import { env } from "@/utils/env";

export default function robots(): MetadataRoute.Robots {
  let baseUrl = env.BETTER_AUTH_URL;
  if (env.NODE_ENV === "production" && baseUrl.includes("localhost")) {
    baseUrl = "https://ahankarastudios.com";
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/account",
        "/account/",
        "/checkout",
        "/checkout/",
        "/cart",
        "/cart/",
        "/wishlist",
        "/wishlist/",
        "/api",
        "/api/",
        "/auth",
        "/auth/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
