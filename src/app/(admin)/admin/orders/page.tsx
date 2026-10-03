import React from 'react';
import { OrderService } from '@/server/services/order.service';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { OrderListTable } from '@/components/admin/orders/OrderListTable';
import { headers } from 'next/headers';
import { AlertTriangle } from 'lucide-react';


export const metadata = {
  title: 'Orders | AHANKARA STUDIOS',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page as string || '1', 10);
  const search = resolvedParams.search as string | undefined;
  const status = resolvedParams.status as string | undefined;
  const dateFrom = resolvedParams.dateFrom as string | undefined;
  const dateTo = resolvedParams.dateTo as string | undefined;

  const requestHeaders = await headers();

  let response;
  let hasError = false;

  await AuthService.requireRole(requestHeaders, UserRole.ADMIN);

  try {
    const rawResponse = await OrderService.getAllOrders(page, 20, {
      search,
      status,
      dateFrom,
      dateTo,
    });

    // Safely serialize dates/Decimal
    response = JSON.parse(JSON.stringify(rawResponse));
  } catch (err) {
    console.error("Failed to load orders:", err);
    hasError = true;
  }

  if (hasError || !response) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage customer orders and fulfillment
          </p>
        </div>
      </div>

      <OrderListTable data={response} />
    </div>
  );
}
