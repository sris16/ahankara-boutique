'use client';

import React, { useState } from 'react';
import { RefreshCcw, CheckCircle, PackageCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ExchangeManager({ exchangeRequests }: { exchangeRequests: any[] }) {
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
        const errorMessage = data.message || (typeof data.error === 'string' ? data.error : null) || 'Failed to ${action} exchange';
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

  if (!exchangeRequests || exchangeRequests.length === 0) {
    return null; // Exchange section is hidden if there are no exchanges
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <RefreshCcw className="w-5 h-5 mr-2" />
          Exchanges
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {exchangeRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">Exchange Request: {req.id.split('-')[0]}</p>
                <p className="text-xs text-gray-500">Requested on: {new Date(req.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {req.status}
                </span>
              </div>
            </div>

            <div className="p-4">
              {req.reason && (
                <div className="mb-4 text-sm text-gray-600">
                  <strong>Reason:</strong> {req.reason.replace(/_/g, ' ')}
                </div>
              )}

              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="p-2 border-b">Original Item</th>
                    <th className="p-2 border-b">Replacement Variant ID</th>
                    <th className="p-2 border-b">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {req.items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-2">
                        {item.orderItem?.productName || 'Unknown Product'}
                        {item.orderItem?.size ? ` - ${item.orderItem.size}` : ''}
                      </td>
                      <td className="p-2 font-mono text-xs">{item.replacementVariantId}</td>
                      <td className="p-2">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex justify-end gap-2">
                {req.status === 'REQUESTED' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, 'approve')}
                    disabled={loadingActionId === `approve-${req.id}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {loadingActionId === `approve-${req.id}` ? 'Approving...' : 'Approve Exchange'}
                  </Button>
                )}

                {req.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, 'complete')}
                    disabled={loadingActionId === `complete-${req.id}`}
                  >
                    <PackageCheck className="w-4 h-4 mr-1" />
                    {loadingActionId === `complete-${req.id}` ? 'Completing...' : 'Complete Exchange'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
