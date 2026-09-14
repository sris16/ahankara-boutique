'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import type { LowStockVariant } from '@/types/admin';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LowStockAlerts() {
  const [alerts, setAlerts] = useState<LowStockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await adminApi.getLowStockAlerts();
        setAlerts(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 rounded-lg h-32 w-full"></div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show anything if stock is healthy
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Low Stock Alerts
          </h2>
          <p className="text-orange-700 text-sm mt-1">
            {alerts.length} variant{alerts.length !== 1 ? 's are' : ' is'} running low on stock.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((variant) => {
          const available = variant.quantity - variant.reservedQuantity;
          return (
            <div key={variant.id} className="bg-white rounded-md p-4 border border-orange-100 shadow-sm flex flex-col justify-between">
              <div>
                <p className="font-medium text-gray-900">{variant.sku}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {variant.color} {variant.color && variant.size && '•'} {variant.size}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-orange-600">{available}</span>
                  <span className="text-sm text-gray-500">available (Threshold: {variant.lowStockThreshold})</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full justify-between group">
                <Link href={`/admin/inventory/${variant.productId}/variants/${variant.variantId}`}>
                  Manage Stock
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
