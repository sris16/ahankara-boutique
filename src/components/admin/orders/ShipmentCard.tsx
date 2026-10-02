'use client';

import React, { useState } from 'react';
import type { AdminShipment, AdminOrder } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, XCircle, AlertTriangle, Truck, ExternalLink } from 'lucide-react';
import { CancelShipmentDialog } from './CancelShipmentDialog';
import { ShipmentTrackingTimeline } from './ShipmentTrackingTimeline';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ShipmentCard({ shipment }: { shipment: AdminShipment; order: AdminOrder }) {
  const router = useRouter();
  const [isRequestingAWB, setIsRequestingAWB] = useState(false);
  const [awbError, setAwbError] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handleRequestAWB = async () => {
    setIsRequestingAWB(true);
    setAwbError(null);
    try {
      await adminApi.assignAWB(shipment.id);
      router.refresh();
    } catch (err) {
      const error = err as Error & { response?: { data?: { error?: string } } };
      setAwbError(error.response?.data?.error || error.message || 'AWB allocation failed.');
    } finally {
      setIsRequestingAWB(false);
    }
  };

  const isCancelled = shipment.status === 'CANCELLED';
  const canRequestAWB = !isCancelled && !shipment.awb && (shipment.status === 'PENDING' || shipment.status === 'READY_TO_SHIP' || shipment.status === 'SHIPMENT_CREATED');
  const canCancel = !isCancelled && shipment.status !== 'DELIVERED';

  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'DELIVERED':
        return 'default';
      case 'CANCELLED':
      case 'DELIVERY_FAILED':
        return 'destructive';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'secondary';
      case 'SHIPMENT_CREATED':
      case 'PENDING':
      case 'READY_TO_SHIP':
      case 'PICKUP_SCHEDULED':
      case 'PICKED_UP':
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`overflow-hidden transition-opacity ${isCancelled ? 'opacity-75' : ''}`}>
      <CardHeader className="bg-muted/30 border-b p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-lg flex items-center font-bold">
              <Truck className="w-5 h-5 mr-2 text-muted-foreground" />
              Shipment {shipment.id.slice(-6).toUpperCase()}
            </CardTitle>
            <Badge variant={getStatusVariant(shipment.status)}>
              {shipment.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">Provider: {shipment.provider}</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {canRequestAWB && (
            <Button
              onClick={handleRequestAWB}
              disabled={isRequestingAWB}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isRequestingAWB ? 'Requesting...' : 'Request AWB'}
            </Button>
          )}

          {canCancel && (
            <Button
              onClick={() => setIsCancelDialogOpen(true)}
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Shipment
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {awbError && (
          <div className="p-4 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">AWB Assignment Failed</p>
              <p className="text-xs mt-1 text-destructive/80">{awbError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Included Items */}
          <div className="p-4 sm:p-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Included Items</h4>
            <ul className="space-y-3">
              {(shipment.items || []).map((sItem) => (
                <li key={sItem.id} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-4">
                    <span className="font-medium text-foreground">{sItem.orderItem?.productName || 'Unknown Product'}</span>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      {sItem.orderItem?.sku && <span className="font-mono">{sItem.orderItem.sku}</span>}
                      {sItem.orderItem?.size && <span>Size: {sItem.orderItem.size}</span>}
                      {sItem.orderItem?.color && <span>Color: {sItem.orderItem.color}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-sm">Qty: {sItem.quantity}</Badge>
                </li>
              ))}
            </ul>
          </div>

          {/* Tracking Information */}
          <div className="p-4 sm:p-6 bg-muted/5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Tracking Details</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">AWB Number</p>
                <p className="text-sm font-medium text-foreground font-mono">{shipment.awb || 'Not assigned yet'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Courier</p>
                  <p className="text-sm font-medium text-foreground">{shipment.courierName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Provider ID</p>
                  <p className="text-sm font-medium text-foreground font-mono truncate" title={shipment.providerOrderId || undefined}>
                    {shipment.providerOrderId || '-'}
                  </p>
                </div>
              </div>

              {shipment.trackingUrl && (
                <div className="pt-2">
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline font-medium"
                    aria-label="View official tracking link in new tab"
                  >
                    View Official Tracking <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Boundary */}
        <div className="border-t border-border p-4 sm:p-6 bg-muted/10">
          <ShipmentTrackingTimeline events={shipment.trackingEvents || []} />
        </div>
      </CardContent>

      {isCancelDialogOpen && (
        <CancelShipmentDialog
          shipment={shipment}
          onClose={() => setIsCancelDialogOpen(false)}
        />
      )}
    </Card>
  );
}
