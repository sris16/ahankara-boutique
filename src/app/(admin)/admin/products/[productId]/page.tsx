import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
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
  const cookieHeader = reqHeaders.get('cookie') ?? '';
  
  let product;
  try {
    product = await adminApi.getProductById(productId, { Cookie: cookieHeader });
  } catch (err) {
    notFound();
  }

  const [categories, collections] = await Promise.all([
    adminApi.getCategories({ Cookie: cookieHeader }).catch(() => []),
    adminApi.getCollections({ Cookie: cookieHeader }).catch(() => [])
  ]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Edit Product: {product.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">/{product.slug}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <h3 className="text-lg font-serif mb-4">Basic Information</h3>
            <ProductForm 
              product={product} 
              categories={categories} 
              collections={collections} 
            />
          </section>

          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <VariantManager product={product} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-card border rounded-sm p-6 shadow-sm">
            <ProductMediaManager product={product} />
          </section>
        </div>
      </div>
    </div>
  );
}
