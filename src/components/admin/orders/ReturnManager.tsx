'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, PackageOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import type { ReturnRequest, ReturnItem, OrderItem } from '@prisma/client';

type AdminReturnItem = ReturnItem & {
  orderItem: OrderItem;
};

type AdminReturn = ReturnRequest & {
  items: AdminReturnItem[];
};

export function ReturnManager({ returnRequests }: { returnRequests: AdminReturn[] }) {
  const router = useRouter();
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [inspectingReturnId, setInspectingReturnId] = useState<string | null>(null);
  const [inspectionData, setInspectionData] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (returnId: string) => {
    try {
      setLoadingActionId(`approve-${returnId}`);
      setError(null);
      const res = await fetch(`/api/admin/returns/${returnId}/approve`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to approve return';
        throw new Error(errorMessage);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleInspectSubmit = async (returnId: string) => {
    try {
      setLoadingActionId(`inspect-${returnId}`);
      setError(null);

      const itemsPayload = Object.entries(inspectionData).map(([returnItemId, acceptedQuantity]) => ({
        returnItemId,
        acceptedQuantity
      }));

      const res = await fetch(`/api/admin/returns/${returnId}/inspect`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errorMessage = data.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to inspect return';
        throw new Error(errorMessage);
      }

      setInspectingReturnId(null);
      setInspectionData({});
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingActionId(null);
    }
  };

  const startInspection = (returnReq: AdminReturn) => {
    const initialData: Record<string, number> = {};
    returnReq.items.forEach((item) => {
      initialData[item.id] = item.quantity; // Default to accepting all requested
    });
    setInspectionData(initialData);
    setInspectingReturnId(returnReq.id);
  };

  if (!returnRequests || returnRequests.length === 0) {
    return null; // Return section is hidden if there are no returns
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'Requested', variant: 'outline' as const };
      case 'APPROVED':
        return { label: 'Approved', variant: 'secondary' as const };
      case 'RECEIVED':
        return { label: 'Received', variant: 'secondary' as const };
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
          <RefreshCw className="w-5 h-5 mr-2 text-muted-foreground" />
          Returns
        </h2>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm flex items-start">
          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {returnRequests.map((req) => {
          const statusConfig = getStatusConfig(req.status);
          const isInspecting = inspectingReturnId === req.id;

          return (
            <Card key={req.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center">
                    Return Request: <span className="font-mono ml-2">{req.id.split('-')[0]}</span>
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
                <div className="p-4 sm:p-6 border-b border-border bg-muted/5">
                  <div className="bg-background p-3 sm:p-4 rounded-md border text-sm text-foreground">
                    <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Reason:</span>
                    <span className="ml-2 font-medium">{req.reason.replace(/_/g, ' ')}</span>
                    {req.customerNote && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Note:</span>
                        <span className="ml-2">{req.customerNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                    Included Items
                  </h4>

                  <div className="space-y-3">
                    {req.items.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 p-4 rounded-md border border-border/60">
                        <div className="flex-1 pr-4">
                          <span className="font-medium text-foreground block">
                            {item.orderItem.productName}
                          </span>
                          {item.orderItem.size && (
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Size: {item.orderItem.size}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 shrink-0 bg-background/50 sm:bg-transparent p-2 sm:p-0 rounded-md border border-border/50 sm:border-transparent">
                          <div className="flex flex-col gap-1 items-start sm:items-end min-w-[100px]">
                            <span className="text-xs font-medium text-muted-foreground">Requested Qty</span>
                            <Badge variant="secondary" className="rounded-sm font-mono text-sm px-2">
                              {item.quantity}
                            </Badge>
                          </div>

                          {isInspecting && (
                            <div className="flex items-center gap-3 bg-surface p-2 rounded-md border shadow-sm shrink-0">
                              <Label htmlFor={`accepted-${item.id}`} className="text-xs font-medium text-foreground whitespace-nowrap">
                                Accept (Max {item.quantity}):
                              </Label>
                              <Input
                                id={`accepted-${item.id}`}
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={inspectionData[item.id] ?? item.quantity}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value);
                                  if (isNaN(val) || val < 0) val = 0;
                                  if (val > item.quantity) val = item.quantity;
                                  setInspectionData({ ...inspectionData, [item.id]: val });
                                }}
                                className="w-16 h-8 text-center px-2 py-1 font-mono"
                                disabled={loadingActionId === `inspect-${req.id}`}
                              />
                            </div>
                          )}
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
                    onClick={() => handleApprove(req.id)}
                    isLoading={loadingActionId === `approve-${req.id}`}
                    className="w-full sm:w-auto"
                  >
                    {loadingActionId !== `approve-${req.id}` && <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve Return
                  </Button>
                )}

                {(req.status === 'APPROVED' || req.status === 'RECEIVED') && !isInspecting && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startInspection(req)}
                    className="w-full sm:w-auto"
                  >
                    <PackageOpen className="w-4 h-4 mr-2" />
                    Inspect & Accept
                  </Button>
                )}

                {isInspecting && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setInspectingReturnId(null)}
                      disabled={loadingActionId === `inspect-${req.id}`}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInspectSubmit(req.id)}
                      isLoading={loadingActionId === `inspect-${req.id}`}
                      className="w-full sm:w-auto"
                    >
                      {loadingActionId !== `inspect-${req.id}` && <CheckCircle className="w-4 h-4 mr-2" />}
                      Submit Inspection
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
