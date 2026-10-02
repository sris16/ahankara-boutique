'use client';

import React from 'react';
import type { AdminProduct } from '@/types/admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <Card className="shadow-sm">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground text-sm">No inventory found matching your criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/10 border-b p-4 sm:p-5">
        <CardTitle className="text-lg font-serif">Inventory Stock</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {variants.map(({ product, variant, inventory }) => {
            const qty = inventory?.quantity || 0;
            const res = inventory?.reservedQuantity || 0;
            const threshold = inventory?.lowStockThreshold || 0;
            const available = qty - res;

            let statusText = 'In Stock';
            let statusVariant: 'success' | 'destructive' | 'warning' = 'success';

            if (available <= 0) {
              statusText = 'Out of Stock';
              statusVariant = 'destructive';
            } else if (available <= threshold) {
              statusText = 'Low Stock';
              statusVariant = 'warning';
            }

            return (
              <div key={variant.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                  {/* Left Column: Context (Product/Variant/SKU) */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      <p className="font-semibold text-foreground truncate max-w-[250px] sm:max-w-md" title={product.name}>
                        {product.name}
                      </p>
                      <Badge variant={statusVariant} className="sm:hidden text-[10px] whitespace-nowrap uppercase">
                        {statusText}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-sm truncate max-w-[120px]" title={variant.sku}>
                        {variant.sku}
                      </span>
                      {variant.size && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                          {variant.size}
                        </span>
                      )}
                      {variant.color && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                          {variant.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Quantities, Status, Action */}
                  <div className="flex flex-row items-center justify-between sm:justify-end gap-6 sm:w-auto shrink-0">

                    {/* Metrics Stack */}
                    <div className="flex flex-col items-start sm:items-end gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-bold text-foreground">{available}</span>
                      </div>
                      <div className="flex flex-row gap-3 text-xs text-muted-foreground">
                        <span>Physical: {qty}</span>
                        <span>Reserved: {res > 0 ? <span className="text-warning font-medium">{res}</span> : '0'}</span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <Badge variant={statusVariant} className="text-[10px] uppercase">
                        {statusText}
                      </Badge>
                    </div>

                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href={`/admin/inventory/${product.id}/variants/${variant.id}`}>
                        Manage <ArrowRight className="ml-2 w-3 h-3" />
                      </Link>
                    </Button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
