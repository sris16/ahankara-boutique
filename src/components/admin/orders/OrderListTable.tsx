'use client';

import React from 'react';
import type { AdminOrderListResponse } from '@/types/admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderListTableProps {
  data: AdminOrderListResponse;
}

export function OrderListTable({ data }: OrderListTableProps) {
  const { orders, pagination } = data;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p className="text-gray-500">No orders found.</p>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Order Number</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Payment</th>
              <th className="px-6 py-4 font-medium text-right">Total</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => {
              // Status Styling
              let statusClasses = 'bg-gray-100 text-gray-800';
              if (order.status === 'CONFIRMED') statusClasses = 'bg-blue-100 text-blue-800';
              if (order.status === 'PROCESSING') statusClasses = 'bg-purple-100 text-purple-800';
              if (order.status === 'SHIPPED') statusClasses = 'bg-indigo-100 text-indigo-800';
              if (order.status === 'DELIVERED') statusClasses = 'bg-green-100 text-green-800';
              if (order.status === 'CANCELLED' || order.status === 'EXPIRED') statusClasses = 'bg-red-100 text-red-800';

              let paymentClasses = 'bg-gray-100 text-gray-800';
              if (order.paymentStatus === 'PAID') paymentClasses = 'bg-green-100 text-green-800';
              if (order.paymentStatus === 'FAILED') paymentClasses = 'bg-red-100 text-red-800';
              if (order.paymentStatus === 'REFUNDED') paymentClasses = 'bg-orange-100 text-orange-800';

              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.fulfillmentStatus}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <p className="text-gray-900">{order.user?.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">{order.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${paymentClasses}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatMoney(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href={`/admin/orders/${order.id}`}>
                        View <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3">
          <div className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            {pagination.page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/orders?page=${pagination.page - 1}`}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Link>
              </Button>
            )}
            {pagination.page >= pagination.totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/orders?page=${pagination.page + 1}`}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
