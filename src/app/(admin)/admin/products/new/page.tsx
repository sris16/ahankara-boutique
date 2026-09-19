import { headers } from "next/headers";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { ProductForm } from "@/components/admin/products/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New Product | Admin | AHANKARA STUDIOS",
  description: "Create a new catalog product",
};

export default async function NewProductPage() {
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  let categoriesData: any[] = [];
  let collectionsData: any[] = [];

  try {
    const [rawCategories, rawCollections] = await Promise.all([
      CategoryService.getCategories(),
      CollectionService.getCollections()
    ]);
    categoriesData = JSON.parse(JSON.stringify(rawCategories));
    collectionsData = JSON.parse(JSON.stringify(rawCollections));
  } catch (err) {
    console.error("Failed to fetch product dependencies:", err);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Create Product</h2>
          <p className="text-sm text-muted-foreground mt-1">Add basic details. You can add variants and images after creation.</p>
        </div>
      </div>

      <ProductForm
        product={null}
        categories={categoriesData}
        collections={collectionsData}
      />
    </div>
  );
}
