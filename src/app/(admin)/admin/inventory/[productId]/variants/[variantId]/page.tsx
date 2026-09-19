import React from 'react';
import { ProductVariantService } from '@/server/services/product-variant.service';
import { ProductService } from '@/server/services/product.service';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InventoryAdjustmentForm } from '@/components/admin/inventory/InventoryAdjustmentForm';
import { InventoryThresholdForm } from '@/components/admin/inventory/InventoryThresholdForm';
import { TransactionHistoryTable } from '@/components/admin/inventory/TransactionHistoryTable';

export const metadata = {
  title: 'Manage Inventory | AHANKARA STUDIOS Admin',
};

export default async function InventoryVariantPage({
  params
}: {
  params: Promise<{ productId: string; variantId: string }>
}) {
  const { productId, variantId } = await params;

  let variant;
  let product;

  try {
    const reqHeaders = await headers();
    await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

    const rawVariant = await ProductVariantService.getVariantById(productId, variantId);
    const rawProduct = await ProductService.getProductById(productId);

    variant = JSON.parse(JSON.stringify(rawVariant));
    product = JSON.parse(JSON.stringify(rawProduct));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.status === 404) {
      notFound();
    }
    throw err;
  }

  if (!variant.inventory) {
    // Edge case if inventory isn't properly initialized
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg">
          <h2 className="text-lg font-bold mb-2">Inventory Record Missing</h2>
          <p>This variant does not have an active inventory record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Manage Inventory
          </h1>
          <p className="text-sm text-gray-500">
            {product.name} • {variant.sku} {variant.color && `• ${variant.color}`} {variant.size && `• ${variant.size}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryAdjustmentForm
          productId={productId}
          variantId={variantId}
          inventory={variant.inventory}
        />
        <InventoryThresholdForm
          productId={productId}
          variantId={variantId}
          inventory={variant.inventory}
        />
      </div>

      <div className="pt-6">
        <TransactionHistoryTable
          productId={productId}
          variantId={variantId}
        />
      </div>
    </div>
  );
}
