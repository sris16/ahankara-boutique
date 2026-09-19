'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import type { AdminInventory } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, Plus, Minus } from 'lucide-react';

interface Props {
  productId: string;
  variantId: string;
  inventory: AdminInventory;
}

export function InventoryAdjustmentForm({ productId, variantId, inventory }: Props) {
  const router = useRouter();

  const [deltaStr, setDeltaStr] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const delta = parseInt(deltaStr, 10);
  const isValidDelta = !isNaN(delta) && delta !== 0;

  const currentAvailable = inventory.quantity - inventory.reservedQuantity;
  const previewAvailable = isValidDelta ? currentAvailable + delta : currentAvailable;
  const previewQuantity = isValidDelta ? inventory.quantity + delta : inventory.quantity;

  const wouldFailReserve = isValidDelta && previewQuantity < inventory.reservedQuantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidDelta || wouldFailReserve) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await adminApi.adjustInventory(productId, variantId, {
        delta,
        reason: reason || undefined,
        reference: reference || undefined
      });

      setSuccess(true);
      setDeltaStr('');
      setReason('');
      setReference('');
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to adjust inventory');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Adjust Stock</h3>

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
            <span>Stock adjusted successfully</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Quantity</p>
            <p className="text-xl font-semibold">{inventory.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Reserved</p>
            <p className="text-xl font-semibold text-orange-600">{inventory.reservedQuantity}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Available</p>
            <p className="text-xl font-bold">{currentAvailable}</p>
          </div>
          <div className="border-l pl-4">
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
              Preview
            </p>
            <p className={`text-xl font-bold ${wouldFailReserve ? 'text-red-600' : 'text-blue-600'}`}>
              {previewAvailable} <span className="text-sm font-normal">avail</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="delta">Adjustment Amount (+ or -)</Label>
            <div className="flex rounded-md shadow-sm">
              <Button
                type="button"
                variant="outline"
                className="rounded-r-none border-r-0"
                onClick={() => setDeltaStr(prev => { const n = parseInt(prev || '0'); return (n - 1).toString(); })}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="delta"
                type="number"
                value={deltaStr}
                onChange={(e) => setDeltaStr(e.target.value)}
                className="rounded-none text-center"
                placeholder="e.g. 5 or -2"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-l-none border-l-0"
                onClick={() => setDeltaStr(prev => { const n = parseInt(prev || '0'); return (n + 1).toString(); })}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {wouldFailReserve && (
              <p className="text-sm text-red-600 font-medium">
                Adjustment would cause physical quantity ({previewQuantity}) to drop below reserved quantity ({inventory.reservedQuantity}).
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Manual count correction"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reference">Reference / Order # (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-12345"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!isValidDelta || loading || wouldFailReserve}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Adjusting...' : 'Confirm Adjustment'}
        </Button>
      </form>
    </div>
  );
}
