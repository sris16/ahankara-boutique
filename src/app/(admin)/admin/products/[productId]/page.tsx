import { headers } from "next/headers";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { CollectionService } from "@/server/services/collection.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { VariantManager } from "@/components/admin/products/VariantManager";
import { ProductMediaManager } from "@/components/admin/products/ProductMediaManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Product | Admin | AHANKARA STUDIOS",
  description: "Edit product details",
};

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  let productData;
  try {
    const rawProduct = await ProductService.getProductById(productId);
    productData = JSON.parse(JSON.stringify(rawProduct));
  } catch (err) {
    notFound();
  }

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
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Edit Product: {productData.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">/{productData.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <h3 className="text-lg font-serif mb-4">Basic Information</h3>
            <ProductForm
              product={productData}
              categories={categoriesData}
              collections={collectionsData}
            />
          </section>

          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <VariantManager product={productData} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <ProductMediaManager product={productData} />
          </section>
        </div>
      </div>
    </div>
  );
}
