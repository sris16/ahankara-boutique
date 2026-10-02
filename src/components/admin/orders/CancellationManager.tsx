'use client';

import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import type { OrderCancellation } from '@prisma/client';

export function CancellationManager({ cancellation, orderId }: { cancellation: OrderCancellation | null, orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);

  const handleCancelOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel order');
      }

      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!cancellation) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Order Cancellation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason" className="text-sm font-medium">
              Reason (Optional)
            </Label>
            <Input
              type="text"
              id="cancellation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., Customer requested via support"
              className="max-w-md"
            />
          </div>

          <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              >
                Cancel Order
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={!loading}>
              <DialogHeader>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this order? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md flex items-start gap-2 text-sm mt-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  isLoading={loading}
                  className="w-full sm:w-auto"
                >
                  Confirm Cancellation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-base font-semibold">Order Cancellation</CardTitle>
        </div>
        <Badge variant="destructive" className="whitespace-nowrap">
          {cancellation.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
          <div>
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Initiator</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{cancellation.initiator}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Requested</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {new Date(cancellation.requestedAt).toLocaleString('en-IN', {
                month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </dd>
          </div>
          <div className="sm:col-span-2 bg-muted/10 border border-border/60 p-4 rounded-md">
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{cancellation.reason || 'None provided'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
