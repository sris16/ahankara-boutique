'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import type { AdminInventory } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  productId: string;
  variantId: string;
  inventory: AdminInventory;
}

export function InventoryThresholdForm({ productId, variantId, inventory }: Props) {
  const router = useRouter();
  
  const [thresholdStr, setThresholdStr] = useState<string>(inventory.lowStockThreshold.toString());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const threshold = parseInt(thresholdStr, 10);
  const isValid = !isNaN(threshold) && threshold >= 0;
  const isChanged = threshold !== inventory.lowStockThreshold;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !isChanged) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await adminApi.updateLowStockThreshold(productId, variantId, {
        lowStockThreshold: threshold
      });
      
      setSuccess(true);
      router.refresh();
      
      setTimeout(() => setSuccess(false), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to update threshold');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Low Stock Configuration</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Threshold updated</span>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="threshold">Low Stock Threshold</Label>
          <div className="flex gap-4">
            <Input
              id="threshold"
              type="number"
              min="0"
              value={thresholdStr}
              onChange={(e) => setThresholdStr(e.target.value)}
              className="max-w-[120px]"
              required
            />
            <Button 
              type="submit" 
              disabled={!isValid || !isChanged || loading}
              variant="secondary"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Item will be marked as &quot;Low Stock&quot; when available quantity is greater than 0 but less than or equal to this threshold.
          </p>
        </div>
      </form>
    </div>
  );
}
