'use client';

import React from 'react';
import type { AdminProduct } from '@/types/admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface InventoryTableProps {
  products: AdminProduct[];
}

export function InventoryTable({ products }: InventoryTableProps) {
  // Flatten products into a list of variants
  const variants = products.flatMap((product) =>
    (product.variants || []).map((variant) => ({
      product,
      variant,
      inventory: variant.inventory
    }))
  );

  if (variants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p className="text-gray-500">No inventory found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Product / SKU</th>
              <th className="px-6 py-4 font-medium">Variant Details</th>
              <th className="px-6 py-4 font-medium text-right">Physical Quantity</th>
              <th className="px-6 py-4 font-medium text-right">Reserved</th>
              <th className="px-6 py-4 font-medium text-right">Available</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map(({ product, variant, inventory }) => {
              const qty = inventory?.quantity || 0;
              const res = inventory?.reservedQuantity || 0;
              const threshold = inventory?.lowStockThreshold || 0;
              const available = qty - res;

              let statusText = 'IN STOCK';
              let statusClasses = 'bg-green-100 text-green-800';

              if (available <= 0) {
                statusText = 'OUT OF STOCK';
                statusClasses = 'bg-red-100 text-red-800';
              } else if (available <= threshold) {
                statusText = 'LOW STOCK';
                statusClasses = 'bg-orange-100 text-orange-800';
              }

              return (
                <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">{variant.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {variant.color || '-'} / {variant.size || '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {qty}
                  </td>
                  <td className="px-6 py-4 text-right text-orange-600">
                    {res > 0 ? res : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {available}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href={`/admin/inventory/${product.id}/variants/${variant.id}`}>
                        Manage <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
