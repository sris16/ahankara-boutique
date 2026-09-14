import React from 'react';
import { adminApi } from '@/lib/api/admin';
import { OrderListTable } from '@/components/admin/orders/OrderListTable';
import { headers } from 'next/headers';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Orders | AHANKARA STUDIOS',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? '';
  
  try {
    const response = await adminApi.getOrders(page, 20, {
      Cookie: cookieHeader,
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage customer orders and fulfillment
          </p>
        </div>

        <OrderListTable data={response} />
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800">Failed to load orders</h2>
        <p className="text-sm text-red-600 mt-2">
          There was an error retrieving the orders list. Please try again.
        </p>
      </div>
    );
  }
}
