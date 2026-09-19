'use client';

import React, { useState } from 'react';
import type { AdminShipment, AdminOrder } from '@/types/admin';
import { adminApi } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FileText, XCircle, AlertTriangle, Truck } from 'lucide-react';
import { CancelShipmentDialog } from './CancelShipmentDialog';
import { ShipmentTrackingTimeline } from './ShipmentTrackingTimeline';

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
      setAwbError(error.response?.data?.error || error.message || 'AWB allocation failed. The shipping provider may require account recharge.');
    } finally {
      setIsRequestingAWB(false);
    }
  };

  const isCancelled = shipment.status === 'CANCELLED';
  const canRequestAWB = !isCancelled && !shipment.awb && (shipment.status === 'PENDING' || shipment.status === 'READY_TO_SHIP' || shipment.status === 'SHIPMENT_CREATED');
  const canCancel = !isCancelled && shipment.status !== 'DELIVERED';

  let statusClasses = 'bg-gray-100 text-gray-800';
  if (isCancelled) statusClasses = 'bg-red-100 text-red-800';
  else if (shipment.status === 'DELIVERED') statusClasses = 'bg-green-100 text-green-800';
  else if (shipment.status === 'IN_TRANSIT' || shipment.status === 'OUT_FOR_DELIVERY') statusClasses = 'bg-indigo-100 text-indigo-800';
  else statusClasses = 'bg-blue-100 text-blue-800';

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${isCancelled ? 'opacity-75' : ''}`}>
      <div className="border-b px-6 py-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Shipment {shipment.id.slice(-6).toUpperCase()}
            </h3>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${statusClasses}`}>
              {shipment.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Provider: {shipment.provider}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canRequestAWB && (
            <Button
              onClick={handleRequestAWB}
              disabled={isRequestingAWB}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-gray-50 border-indigo-200 text-indigo-700 hover:text-indigo-800"
            >
              <FileText className="w-4 h-4 mr-1" />
              {isRequestingAWB ? 'Requesting...' : 'Request AWB'}
            </Button>
          )}

          {canCancel && (
            <Button
              onClick={() => setIsCancelDialogOpen(true)}
              size="sm"
              variant="outline"
              className="bg-white hover:bg-gray-50 border-red-200 text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel Shipment
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {awbError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">AWB Assignment Failed</p>
              <p className="text-xs mt-1 text-red-700">{awbError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 border-b pb-1">Included Items</h4>
            <ul className="space-y-2">
              {(shipment.items || []).map((sItem) => (
                <li key={sItem.id} className="text-sm text-gray-700 flex justify-between">
                  <span>{sItem.quantity}x {sItem.orderItem?.productName || 'Unknown Product'}</span>
                  <span className="text-gray-500 text-xs">{sItem.orderItem?.sku}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2 border-b pb-1">Tracking Information</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="text-gray-500">AWB:</span> {shipment.awb || 'Not assigned yet'}</p>
              <p><span className="text-gray-500">Courier:</span> {shipment.courierName || '-'}</p>
              <p><span className="text-gray-500">Provider Order ID:</span> {shipment.providerOrderId || '-'}</p>
              {shipment.trackingUrl && (
                <p>
                  <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                    View official tracking tracking
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <ShipmentTrackingTimeline events={shipment.trackingEvents || []} />
        </div>
      </div>

      {isCancelDialogOpen && (
        <CancelShipmentDialog
          shipment={shipment}
          onClose={() => setIsCancelDialogOpen(false)}
        />
      )}
    </div>
  );
}
