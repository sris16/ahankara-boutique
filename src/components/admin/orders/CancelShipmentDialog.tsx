'use client';

import React, { useState } from 'react';
import type { AdminShipment } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

export function CancelShipmentDialog({ shipment, onClose }: { shipment: AdminShipment; onClose: () => void }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await adminApi.cancelShipment(shipment.id);
      router.refresh();
      onClose();
    } catch (err) {
      const error = err as Error & { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || error.message || 'Failed to cancel the shipment.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 text-red-600 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Cancel Shipment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-sm mb-4">
            Are you sure you want to cancel this shipment? The provider (e.g. Shiprocket) will be notified immediately.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm mb-4">
            <strong>Important:</strong> Cancelling this shipment does not automatically cancel the parent order or refund the customer. It only cancels this physical delivery leg and releases the unfulfilled quantities back to the order.
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Keep Shipment
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Shipment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
