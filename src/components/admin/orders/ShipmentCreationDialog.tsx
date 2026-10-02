'use client';

import React, { useState } from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
        provider: 'MOCK', // Using configured active provider
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
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Create Shipment</DialogTitle>
            <DialogDescription>
              All items in this order have already been fulfilled.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            There are no items left to ship.
          </div>
          <DialogFooter>
            <Button onClick={onClose} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
          <DialogDescription>
            Select the items and quantities you want to fulfill in this shipment.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-start mt-2">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form id="create-shipment-form" onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Items to Fulfill</h3>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {unfulfilledItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-md border">
                  <div className="flex-1">
                    <Label htmlFor={`quantity-${item.id}`} className="font-semibold text-foreground text-sm mb-1 block">
                      {item.productName}
                    </Label>
                    <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-background p-2 rounded-md border shrink-0">
                    <Label htmlFor={`quantity-${item.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                      Qty (Max {item.remaining}):
                    </Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="0"
                      max={item.remaining}
                      value={selections[item.id] || 0}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value, item.remaining)}
                      className="w-16 h-8 text-center px-2 py-1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 border rounded-md p-3 text-sm text-muted-foreground flex gap-3 items-start">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p>
              <strong className="text-foreground">Shipping Provider:</strong> The current environment uses the configured Mock shipping provider. A new internal shipment record will be created.
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-shipment-form"
            isLoading={isSubmitting}
            disabled={totalSelected === 0}
          >
            Create Shipment ({totalSelected} item{totalSelected === 1 ? '' : 's'})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
