import { Suspense } from "react";
import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Categories | Admin | AHANKARA STUDIOS",
  description: "Manage product categories",
};

export default async function CategoriesPage() {
  const reqHeaders = await headers();
  
  // Fetch tree and flat list for parent selection
  const [tree, flatList] = await Promise.all([
    adminApi.getCategoryTree(reqHeaders).catch(() => []),
    adminApi.getCategories(reqHeaders).catch(() => [])
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Categories</h2>
        <p className="text-sm text-muted-foreground mt-1">Organize products into hierarchical categories</p>
      </div>

      <CategoryManager initialTree={tree} flatCategories={flatList} />
    </div>
  );
}
