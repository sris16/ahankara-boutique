'use client';

import React, { useState } from 'react';
import { Banknote, AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import type { Refund, RefundStatus } from '@prisma/client';

function getStatusConfig(status: RefundStatus | string): { variant: BadgeProps['variant'], icon: React.ReactNode, label: string } {
  switch (status) {
    case 'SUCCEEDED':
      return { variant: 'success', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Succeeded' };
    case 'PENDING':
      return { variant: 'outline', icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Pending' };
    case 'PROCESSING':
      return { variant: 'secondary', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Processing' };
    case 'FAILED':
      return { variant: 'destructive', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Failed' };
    case 'CANCELLED':
      return { variant: 'outline', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Cancelled' };
    case 'REQUIRES_REVIEW':
      return { variant: 'warning', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Requires Review' };
    default:
      return { variant: 'outline', icon: null, label: status };
  }
}

export function RefundManager({ refunds }: { refunds: Refund[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcessRefund = async (refundId: string) => {
    try {
      setLoadingId(refundId);
      setError(null);

      const res = await fetch(`/api/admin/refunds/${refundId}/process`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to process refund';
        throw new Error(errorMessage);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingId(null);
    }
  };

  if (!refunds || refunds.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">Refunds</CardTitle>
        </div>
        <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full">
          {refunds.length}
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {error && (
            <div className="p-4 sm:px-6 bg-destructive/10 text-destructive text-sm flex items-start gap-2 border-b border-border/50">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {refunds.map((refund) => {
            const statusConfig = getStatusConfig(refund.status);
            return (
              <div key={refund.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(refund.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1 break-all">ID: {refund.id}</p>
                    {refund.providerRefundId && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">Ref: {refund.providerRefundId}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                    <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap">
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </Badge>

                    {refund.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessRefund(refund.id)}
                        isLoading={loadingId === refund.id}
                        className="w-full sm:w-auto"
                      >
                        Process Refund
                      </Button>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-border/50 mt-4">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{refund.reason || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Created</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {new Date(refund.createdAt).toLocaleString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </dd>
                  </div>
                  {refund.failureReason && (
                    <div className="sm:col-span-2 bg-destructive/10 border border-destructive/20 p-3 rounded-md text-xs text-destructive">
                      <span className="font-semibold uppercase tracking-wider">Failure Reason:</span> <span className="ml-1">{refund.failureReason}</span>
                    </div>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
