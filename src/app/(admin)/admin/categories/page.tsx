import { Suspense } from "react";
import { headers } from "next/headers";
import { CategoryService } from "@/server/services/category.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Categories | Admin | AHANKARA STUDIOS",
  description: "Manage product categories",
};

export default async function CategoriesPage() {
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  let treeData: any[] = [];
  let flatListData: any[] = [];

  try {
    // Fetch tree and flat list for parent selection (pass false to get both active and inactive categories for Admin)
    const [rawTree, rawFlatList] = await Promise.all([
      CategoryService.getCategoryTree(false),
      CategoryService.getCategories(false)
    ]);

    // Serialize data (convert Date objects to strings for Client Component boundary)
    treeData = JSON.parse(JSON.stringify(rawTree));
    flatListData = JSON.parse(JSON.stringify(rawFlatList));
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Categories</h2>
        <p className="text-sm text-muted-foreground mt-1">Organize products into hierarchical categories</p>
      </div>

      <CategoryManager initialTree={treeData} flatCategories={flatListData} />
    </div>
  );
}
