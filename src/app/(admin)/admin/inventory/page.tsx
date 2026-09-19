import React from 'react';
import type { AdminProduct } from '@/types/admin';
import { ProductService } from '@/server/services/product.service';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { InventoryTable } from '@/components/admin/inventory/InventoryTable';
import { LowStockAlerts } from '@/components/admin/inventory/LowStockAlerts';
import { headers } from 'next/headers';
import { AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Inventory | AHANKARA STUDIOS Admin',
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === 'string' ? params.search : undefined;

  let products: AdminProduct[] = [];
  let totalPages = 1;
  let error = null;

  try {
    const reqHeaders = await headers();

    // Explicitly enforce ADMIN authorization at the component level
    await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

    // Directly invoke the service instead of using the HTTP API
    const response = await ProductService.getAdminProducts({ page, limit: 20, search });
    // Serialize dates to strings to match the AdminProduct type which expects JSON-serialized data
    products = JSON.parse(JSON.stringify(response.data));
    totalPages = response.meta.totalPages || 1;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    error = err.message || 'Failed to load inventory data';
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Inventory Management
        </h1>
      </div>

      <LowStockAlerts />

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* We reuse InventoryTable which flattens the products */}
          <InventoryTable products={products} />

          {/* Simple Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} (paginated by product)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={`/admin/inventory?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                      Previous
                    </Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={`/admin/inventory?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                      Next
                    </Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
