'use client';

import React, { useState } from 'react';
import { Banknote, AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RefundManager({ refunds }: { refunds: any[] }) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  if (!refunds || refunds.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">Refunds</h3>
        </div>
        <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-sm font-medium">
          {refunds.length}
        </span>
      </div>

      <div className="divide-y divide-gray-200">
        {error && (
          <div className="p-4 bg-red-50 text-red-800 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {refunds.map((refund) => (
          <div key={refund.id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice(refund.amount)}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">ID: {refund.id}</p>
                {refund.providerRefundId && (
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Ref: {refund.providerRefundId}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  refund.status === 'SUCCEEDED' ? 'bg-green-50 text-green-700 border-green-200' :
                  refund.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  refund.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {refund.status === 'SUCCEEDED' && <CheckCircle className="w-3.5 h-3.5" />}
                  {refund.status === 'PENDING' && <RefreshCw className="w-3.5 h-3.5" />}
                  {refund.status === 'FAILED' && <XCircle className="w-3.5 h-3.5" />}
                  {refund.status === 'PROCESSING' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {refund.status}
                </span>

                {refund.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleProcessRefund(refund.id)}
                    disabled={loadingId === refund.id}
                  >
                    {loadingId === refund.id ? 'Processing...' : 'Process Refund'}
                  </Button>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-gray-100">
              <div>
                <dt className="text-xs font-medium text-gray-500">Reason</dt>
                <dd className="mt-1 text-sm text-gray-900">{refund.reason || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Date Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(refund.createdAt).toLocaleString('en-IN')}
                </dd>
              </div>
              {refund.failureReason && (
                <div className="sm:col-span-2 bg-red-50 p-2 rounded text-xs text-red-800">
                  <span className="font-semibold">Failure Reason:</span> {refund.failureReason}
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
