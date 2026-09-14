import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
import { ProductTable } from "@/components/admin/products/ProductTable";

export const metadata = {
  title: "Products | Admin | AHANKARA STUDIOS",
  description: "Manage catalog products",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get('cookie') ?? '';
  const params = await searchParams;
  
  const query = {
    page: typeof params.page === 'string' ? params.page : '1',
    limit: typeof params.limit === 'string' ? params.limit : '10',
    search: typeof params.search === 'string' ? params.search : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    categoryId: typeof params.category === 'string' ? params.category : undefined,
  };

  // Safe fetch for products
  const productsResponse = await adminApi.getProducts(query, { Cookie: cookieHeader }).catch(() => null);
  const categories = await adminApi.getCategories({ Cookie: cookieHeader }).catch(() => []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Products</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage product catalog, variants, and media</p>
      </div>

      <ProductTable 
        initialData={productsResponse?.data || []} 
        meta={productsResponse?.meta} 
        categories={categories}
      />
    </div>
  );
}
