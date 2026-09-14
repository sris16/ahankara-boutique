'use client';

import React, { useState } from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

interface ShipmentCreationDialogProps {
  order: AdminOrder;
  shipments: AdminShipment[];
  onClose: () => void;
}

export function ShipmentCreationDialog({ order, shipments, onClose }: ShipmentCreationDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate unfulfilled quantities
  const unfulfilledItems = (order.items || [])
    .map(item => {
      let fulfilled = 0;
      shipments.forEach(s => {
        if (s.status !== 'CANCELLED') {
          const sItem = s.items?.find(si => si.orderItemId === item.id);
          if (sItem) fulfilled += sItem.quantity;
        }
      });
      return { ...item, remaining: Math.max(0, item.quantity - fulfilled) };
    })
    .filter(item => item.remaining > 0);

  // Local state for selected quantities
  const [selections, setSelections] = useState<Record<string, number>>(
    unfulfilledItems.reduce((acc, item) => ({ ...acc, [item.id]: item.remaining }), {})
  );

  const handleQuantityChange = (itemId: string, value: string, max: number) => {
    let num = parseInt(value, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > max) num = max;
    setSelections(prev => ({ ...prev, [itemId]: num }));
  };

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSelected === 0) {
      setError('Please select at least one item to fulfill.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const itemsToFulfill = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

    try {
      await adminApi.createShipment(order.id, {
        provider: 'SHIPROCKET',
        items: itemsToFulfill
      });
      router.refresh();
      onClose();
    } catch (err) {
      const error = err as Error & { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || error.message || 'An error occurred while creating the shipment.');
      setIsSubmitting(false);
    }
  };

  if (unfulfilledItems.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Create Shipment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 text-center text-gray-600">
            All items have been completely fulfilled.
          </div>
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Create Shipment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form id="create-shipment-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Select Items to Fulfill</h3>
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                {unfulfilledItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku} | Remaining: {item.remaining}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Qty:</label>
                      <input
                        type="number"
                        min="0"
                        max={item.remaining}
                        value={selections[item.id] || 0}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value, item.remaining)}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
              <p><strong>Provider:</strong> Shiprocket will be used for fulfillment. A new internal shipment record will be created, and the order will be sent to Shiprocket immediately.</p>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="create-shipment-form" 
            disabled={isSubmitting || totalSelected === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? 'Creating...' : `Create Shipment (${totalSelected} items)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
