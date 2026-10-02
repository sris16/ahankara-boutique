'use client';

import React from 'react';
import type { AdminOrderListResponse } from '@/types/admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ChevronLeft, ChevronRight, Search, FileText, Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface OrderListTableProps {
  data: AdminOrderListResponse;
}

export function OrderListTable({ data }: OrderListTableProps) {
  const { orders, pagination } = data;
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state extracted directly (Removes anti-pattern)
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const updateFilters = (updates: { search?: string; status?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Always reset to page 1 when filtering
    params.set('page', '1');

    if (updates.search !== undefined) {
      if (updates.search) params.set('search', updates.search);
      else params.delete('search');
    }

    if (updates.status !== undefined) {
      if (updates.status) params.set('status', updates.status);
      else params.delete('status');
    }

    if (updates.dateFrom !== undefined) {
      if (updates.dateFrom) params.set('dateFrom', updates.dateFrom);
      else params.delete('dateFrom');
    }

    if (updates.dateTo !== undefined) {
      if (updates.dateTo) params.set('dateTo', updates.dateTo);
      else params.delete('dateTo');
    }

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateFilters({ search: formData.get('search') as string });
  };

  const formatMoney = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'default';
      case 'PROCESSING': return 'secondary';
      case 'SHIPPED': return 'accent';
      case 'DELIVERED': return 'success';
      case 'CANCELLED':
      case 'EXPIRED': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'success';
      case 'FAILED': return 'destructive';
      case 'REFUNDED': return 'warning';
      default: return 'outline';
    }
  };

  const isFiltering = searchParams.has('search') || searchParams.has('status') || searchParams.has('dateFrom') || searchParams.has('dateTo');

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end">
          <form onSubmit={handleSearch} className="flex-1 w-full relative">
            <label htmlFor="search-orders" className="text-xs font-medium text-muted-foreground mb-1.5 block">Search Orders</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-orders"
                name="search"
                defaultValue={search}
                key={`search-${search}`}
                placeholder="Search by Order ID, Name, or Email..."
                className="pl-9 h-10 w-full"
              />
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto">
            <div className="w-full">
              <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => updateFilters({ status: e.target.value })}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </Select>
            </div>

            <div className="w-full relative">
              <label htmlFor="date-from" className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="date-from"
                  type="date"
                  defaultValue={dateFrom}
                  key={`from-${dateFrom}`}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="pl-9 h-10 w-full"
                  aria-label="Filter from date"
                />
              </div>
            </div>

            <div className="w-full relative">
              <label htmlFor="date-to" className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="date-to"
                  type="date"
                  defaultValue={dateTo}
                  key={`to-${dateTo}`}
                  min={dateFrom}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="pl-9 h-10 w-full"
                  aria-label="Filter to date"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground bg-muted/10 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <FileText className="w-10 h-10 mb-4 opacity-40" />
          {isFiltering ? (
            <>
              <p className="text-lg font-medium text-foreground">No orders found</p>
              <p className="mt-1">We couldn&apos;t find any orders matching your current filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/orders')}>
                Clear all filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground">No orders yet</p>
              <p className="mt-1">When customers place orders, they will appear here.</p>
            </>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} hoverElevate className="overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Primary Block: Details & Dates */}
                  <div className="flex-1 p-4 md:p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-foreground text-sm md:text-base break-words">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(order.status) as "default" | "secondary" | "destructive" | "outline" | "accent" | "success"} className="shrink-0 text-[10px] md:text-xs tracking-wider">
                        {order.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Customer</p>
                        <p className="font-medium text-sm truncate">{order.user?.name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.user?.email}</p>
                      </div>

                      {/* Secondary Block: Status & Amounts */}
                      <div>
                        <p className="text-muted-foreground text-xs font-medium mb-1 uppercase tracking-wider">Financials</p>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">Payment:</span>
                          <Badge variant={getPaymentVariant(order.paymentStatus) as "success" | "destructive" | "warning" | "outline"} size="sm">
                            {order.paymentStatus}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">Total: <span className="font-semibold">{formatMoney(order.totalAmount)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Action Block */}
                  <div className="bg-muted/30 md:bg-transparent border-t md:border-t-0 md:border-l p-4 md:p-6 flex items-center justify-end md:justify-center md:w-32 shrink-0">
                    <Button asChild variant="outline" className="w-full md:w-auto group-hover:border-primary/50 group-hover:text-primary transition-colors">
                      <Link href={`/admin/orders/${order.id}`}>
                        <span className="md:hidden">View Details</span>
                        <span className="hidden md:inline">View</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {pagination.page <= 1 ? (
                  <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link href={`/admin/orders?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: (pagination.page - 1).toString() }).toString()}`}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Link>
                  </Button>
                )}
                {pagination.page >= pagination.totalPages ? (
                  <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                    <Link href={`/admin/orders?${new URLSearchParams({ ...Object.fromEntries(searchParams.entries()), page: (pagination.page + 1).toString() }).toString()}`}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
