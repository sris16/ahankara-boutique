import { headers } from "next/headers";
import { ProductService } from "@/server/services/product.service";
import { CategoryService } from "@/server/services/category.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { ProductTable } from "@/components/admin/products/ProductTable";

export const metadata = {
  title: "Products | Admin | AHANKARA STUDIOS",
  description: "Manage catalog products",
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);
  const params = await searchParams;

  const query = {
    page: typeof params.page === 'string' ? params.page : '1',
    limit: typeof params.limit === 'string' ? params.limit : '10',
    search: typeof params.search === 'string' ? params.search : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    categoryId: typeof params.category === 'string' ? params.category : undefined,
  };

  let productsData: any = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } };
  let categoriesData: any[] = [];

  try {
    const rawProducts = await ProductService.getAdminProducts(query);
    productsData = JSON.parse(JSON.stringify(rawProducts));
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }

  try {
    const rawCategories = await CategoryService.getCategories();
    categoriesData = JSON.parse(JSON.stringify(rawCategories));
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Products</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage product catalog, variants, and media</p>
      </div>

      <ProductTable
        initialData={productsData.data}
        meta={productsData.meta}
        categories={categoriesData}
      />
    </div>
  );
}
