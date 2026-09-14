import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
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
  const cookieHeader = reqHeaders.get('cookie') ?? '';
  const [categories, collections] = await Promise.all([
    adminApi.getCategories({ Cookie: cookieHeader }).catch(() => []),
    adminApi.getCollections({ Cookie: cookieHeader }).catch(() => [])
  ]);

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
        categories={categories} 
        collections={collections} 
      />
    </div>
  );
}
