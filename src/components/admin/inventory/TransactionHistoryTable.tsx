'use client';

import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/admin';
import type { AdminInventoryTransaction } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {  ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { ErrorState } from '@/components/ui/error-state';

interface Props {
  productId: string;
  variantId: string;
}

function getTransactionTypeConfig(type: string): { variant: BadgeProps['variant'], label: string } {
  switch (type) {
    case 'RESTOCK':
    case 'RETURN':
      return { variant: 'success', label: type };
    case 'ADJUSTMENT':
      return { variant: 'secondary', label: type };
    case 'RESERVATION':
    case 'RESERVATION_RELEASE':
      return { variant: 'warning', label: type.replace('_', ' ') };
    case 'SALE':
      return { variant: 'default', label: type };
    default:
      return { variant: 'outline', label: type };
  }
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [productId, variantId, page]);

  if (loading && transactions.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-12 flex justify-center items-center min-h-[300px]">
          <Spinner className="w-8 h-8 opacity-50" size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} homeHref="" />;
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="bg-muted/10 border-b p-4 sm:p-5 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-serif">Transaction History</CardTitle>
        {loading && <Spinner className="w-4 h-4" size="sm" />}
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No transactions found.
            </div>
          ) : (
            transactions.map((tx) => {
              const sign = tx.quantityChange > 0 ? '+' : '';
              const changeColor = tx.quantityChange > 0
                ? 'text-success font-bold'
                : tx.quantityChange < 0
                  ? 'text-destructive font-bold'
                  : 'text-muted-foreground font-semibold';
              const typeConfig = getTransactionTypeConfig(tx.type);

              return (
                <div key={tx.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Left: Type, Date, Reason */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={typeConfig.variant} className="text-[10px] uppercase">
                          {typeConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      {(tx.reason || tx.reference) && (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {tx.reason && (
                            <p className="text-sm text-foreground truncate max-w-full sm:max-w-[300px]" title={tx.reason}>
                              {tx.reason}
                            </p>
                          )}
                          {tx.reference && (
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-full sm:max-w-[300px]" title={tx.reference}>
                              Ref: {tx.reference}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Quantities & Delta */}
                    <div className="flex flex-row items-center justify-between sm:justify-end gap-6 sm:w-auto shrink-0">

                      {/* State Changes */}
                      <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Qty:</span>
                          <span className="font-medium">{tx.quantityBefore}</span>
                          <ArrowRight className="w-3 h-3 mx-0.5 opacity-50" />
                          <span className="font-medium text-foreground">{tx.quantityAfter}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>Res:</span>
                          <span className="font-medium">{tx.reservedBefore}</span>
                          <ArrowRight className="w-3 h-3 mx-0.5 opacity-50" />
                          <span className="font-medium text-foreground">{tx.reservedAfter}</span>
                        </div>
                      </div>

                      {/* Net Change */}
                      <div className="flex flex-col items-end justify-center w-16 sm:w-20 border-l pl-4 border-border">
                        <span className="text-[10px] text-muted-foreground uppercase mb-1">Delta</span>
                        <span className={`text-sm sm:text-base ${changeColor}`}>
                          {sign}{tx.quantityChange !== 0 ? tx.quantityChange : '-'}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
