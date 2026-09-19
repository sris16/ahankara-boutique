'use client';

import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CancellationManager({ cancellation, orderId }: { cancellation: any | null, orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

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

      router.refresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!cancellation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Order Cancellation</h3>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-800 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="E.g., Customer requested via support"
            />
          </div>
          <Button
            onClick={handleCancelOrder}
            disabled={loading}
            variant="outline"
            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
          >
            {loading ? 'Processing...' : 'Cancel Order'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Cancellation</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {cancellation.status}
        </span>
      </div>
      <div className="p-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Initiator</dt>
            <dd className="mt-1 text-sm text-gray-900">{cancellation.initiator}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Date Requested</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(cancellation.requestedAt).toLocaleString('en-IN')}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Reason</dt>
            <dd className="mt-1 text-sm text-gray-900">{cancellation.reason || 'None provided'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
