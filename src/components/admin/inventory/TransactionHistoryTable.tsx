'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import type { AdminInventoryTransaction } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

interface Props {
  productId: string;
  variantId: string;
}

export function TransactionHistoryTable({ productId, variantId }: Props) {
  const [transactions, setTransactions] = useState<AdminInventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      setError(null);
      try {
        const { data, meta } = await adminApi.getInventoryTransactions(productId, variantId, page, 20);
        setTransactions(data);
        setTotalPages(meta.totalPages || 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    }
    
    loadTransactions();
  }, [productId, variantId, page]);

  if (loading && transactions.length === 0) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  if (error && transactions.length === 0) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Transaction History</h3>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium text-right">Change</th>
              <th className="px-6 py-3 font-medium text-right">Quantity (Before → After)</th>
              <th className="px-6 py-3 font-medium text-right">Reserved (Before → After)</th>
              <th className="px-6 py-3 font-medium">Reason / Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const changeColor = tx.quantityChange > 0 ? 'text-green-600' : tx.quantityChange < 0 ? 'text-red-600' : 'text-gray-900';
                const sign = tx.quantityChange > 0 ? '+' : '';
                
                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${changeColor}`}>
                      {sign}{tx.quantityChange !== 0 ? tx.quantityChange : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {tx.quantityBefore} → <span className="font-medium text-gray-900">{tx.quantityAfter}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {tx.reservedBefore} → <span className="font-medium text-gray-900">{tx.reservedAfter}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {tx.reason && <div className="truncate max-w-[200px]" title={tx.reason}>{tx.reason}</div>}
                      {tx.reference && <div className="font-mono mt-1 text-gray-400">{tx.reference}</div>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
