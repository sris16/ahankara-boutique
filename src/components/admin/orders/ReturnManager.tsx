'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, PackageOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ReturnManager({ returnRequests }: { returnRequests: any[] }) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingActionId(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startInspection = (returnReq: any) => {
    const initialData: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returnReq.items.forEach((item: any) => {
      initialData[item.id] = item.quantity; // Default to accepting all requested
    });
    setInspectionData(initialData);
    setInspectingReturnId(returnReq.id);
  };

  if (!returnRequests || returnRequests.length === 0) {
    return null; // Return section is hidden if there are no returns
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2" />
          Returns
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {returnRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">Return Request: {req.id.split('-')[0]}</p>
                <p className="text-xs text-gray-500">Requested on: {new Date(req.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {req.status}
                </span>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600">
                <strong>Reason:</strong> {req.reason.replace(/_/g, ' ')}
                {req.customerNote && <span> | <strong>Note:</strong> {req.customerNote}</span>}
              </div>

              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="p-2 border-b">Item</th>
                    <th className="p-2 border-b">Requested Qty</th>
                    {inspectingReturnId === req.id && (
                      <th className="p-2 border-b">Accepted Qty</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {req.items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-2">
                        {item.orderItem.productName}
                        {item.orderItem.size && ` - ${item.orderItem.size}`}
                      </td>
                      <td className="p-2">{item.quantity}</td>
                      {inspectingReturnId === req.id && (
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={inspectionData[item.id] ?? item.quantity}
                            onChange={(e) => setInspectionData({
                              ...inspectionData,
                              [item.id]: parseInt(e.target.value) || 0
                            })}
                            className="w-20 border rounded p-1"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex justify-end gap-2">
                {req.status === 'REQUESTED' && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req.id)}
                    disabled={loadingActionId === `approve-${req.id}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {loadingActionId === `approve-${req.id}` ? 'Approving...' : 'Approve Return'}
                  </Button>
                )}

                {(req.status === 'APPROVED' || req.status === 'RECEIVED') && inspectingReturnId !== req.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startInspection(req)}
                  >
                    <PackageOpen className="w-4 h-4 mr-1" />
                    Inspect & Accept
                  </Button>
                )}

                {inspectingReturnId === req.id && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setInspectingReturnId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInspectSubmit(req.id)}
                      disabled={loadingActionId === `inspect-${req.id}`}
                    >
                      {loadingActionId === `inspect-${req.id}` ? 'Submitting...' : 'Submit Inspection'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
