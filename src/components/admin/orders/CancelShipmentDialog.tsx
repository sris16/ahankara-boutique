'use client';

import React, { useState } from 'react';
import type { AdminShipment } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
    <Dialog open={true} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cancel Shipment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this shipment? The provider will be notified immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md text-sm mb-4">
            <strong>Important:</strong> Cancelling this shipment does not automatically cancel the parent order or refund the customer. It only cancels this physical delivery leg and releases the unfulfilled quantities back to the order.
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Keep Shipment
          </Button>
          <Button
            onClick={handleCancel}
            isLoading={isSubmitting}
            variant="destructive"
          >
            Yes, Cancel Shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
