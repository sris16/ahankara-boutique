'use client';

import React, { useState } from 'react';
import { RefreshCcw, CheckCircle, PackageCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import type { ExchangeRequest, ExchangeItem, OrderItem } from '@prisma/client';

type AdminExchangeItem = ExchangeItem & {
  orderItem: OrderItem | null;
};

type AdminExchange = ExchangeRequest & {
  items: AdminExchangeItem[];
};

export function ExchangeManager({ exchangeRequests }: { exchangeRequests: AdminExchange[] }) {
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (exchangeId: string, action: 'approve' | 'complete') => {
    try {
      setLoadingActionId(`${action}-${exchangeId}`);
      setError(null);
      const res = await fetch(`/api/admin/exchanges/${exchangeId}/${action}`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.message || (typeof data.error === 'string' ? data.error : null) || `Failed to ${action} exchange`;
        throw new Error(errorMessage);
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingActionId(null);
    }
  };

  if (!exchangeRequests || exchangeRequests.length === 0) {
    return null; // Exchange section is hidden if there are no exchanges
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'Requested', variant: 'outline' as const };
      case 'APPROVED':
        return { label: 'Approved', variant: 'secondary' as const };
      case 'COMPLETED':
        return { label: 'Completed', variant: 'default' as const };
      case 'REJECTED':
        return { label: 'Rejected', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center">
          <RefreshCcw className="w-5 h-5 mr-2 text-muted-foreground" />
          Exchanges
        </h2>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm flex items-start">
          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {exchangeRequests.map((req) => {
          const statusConfig = getStatusConfig(req.status);

          return (
            <Card key={req.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center">
                    Exchange Request: <span className="font-mono ml-2">{req.id.split('-')[0]}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium tracking-wide uppercase">
                    Requested on: {new Date(req.createdAt).toLocaleString('en-IN', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <Badge variant={statusConfig.variant} className="whitespace-nowrap">
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {req.reason && (
                  <div className="p-4 sm:p-6 border-b border-border bg-muted/5">
                    <div className="bg-background p-3 sm:p-4 rounded-md border text-sm text-foreground">
                      <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Reason:</span>
                      <span className="ml-2 font-medium">{req.reason.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Exchange Items
                  </h4>

                  <div className="space-y-3">
                    {req.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 p-4 rounded-md border border-border/60">
                        <div className="flex-1 pr-4">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Original Item</span>
                          <span className="font-medium text-foreground block">
                            {item.orderItem?.productName || 'Unknown Product'}
                          </span>
                          {item.orderItem?.size && (
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Size: {item.orderItem.size}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:items-end pr-0 sm:pr-4 mt-2 sm:mt-0">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block sm:hidden">Replacement</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground sm:hidden">To:</span>
                            <Badge variant="outline" className="font-mono text-xs break-all text-left">
                              {item.replacementVariantId}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 hidden sm:block">Replacement Variant ID</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 shrink-0 bg-background/50 sm:bg-transparent p-2 sm:p-0 rounded-md border border-border/50 sm:border-transparent mt-2 sm:mt-0">
                          <div className="flex flex-col gap-1 items-start sm:items-end min-w-[60px]">
                            <span className="text-xs font-medium text-muted-foreground">Qty</span>
                            <Badge variant="secondary" className="rounded-sm font-mono text-sm px-2">
                              {item.quantity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="px-4 sm:px-6 py-4 border-t bg-muted/30 flex flex-col sm:flex-row justify-end gap-3">
                {req.status === 'REQUESTED' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, 'approve')}
                    isLoading={loadingActionId === `approve-${req.id}`}
                    className="w-full sm:w-auto"
                  >
                    {loadingActionId !== `approve-${req.id}` && <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve Exchange
                  </Button>
                )}

                {req.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, 'complete')}
                    isLoading={loadingActionId === `complete-${req.id}`}
                    className="w-full sm:w-auto"
                  >
                    {loadingActionId !== `complete-${req.id}` && <PackageCheck className="w-4 h-4 mr-2" />}
                    Complete Exchange
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
