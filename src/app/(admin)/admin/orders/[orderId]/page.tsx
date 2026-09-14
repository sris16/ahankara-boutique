import React from 'react';
import { adminApi } from '@/lib/api/admin';
import { headers } from 'next/headers';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OrderSummaryCards } from '@/components/admin/orders/OrderSummaryCards';
import { OrderCustomerDetails } from '@/components/admin/orders/OrderCustomerDetails';
import { OrderItemsList } from '@/components/admin/orders/OrderItemsList';
import { ShipmentManager } from '@/components/admin/orders/ShipmentManager';

export const metadata = {
  title: 'Order Details | AHANKARA STUDIOS',
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;
  
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? '';
  
  try {
    const [order, shipments] = await Promise.all([
      adminApi.getOrderById(orderId, { Cookie: cookieHeader }),
      adminApi.getOrderShipments(orderId, { Cookie: cookieHeader })
    ]);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/orders" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <OrderSummaryCards order={order} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <OrderItemsList order={order} shipments={shipments} />
            <ShipmentManager order={order} shipments={shipments} />
          </div>
          <div className="space-y-6">
            <OrderCustomerDetails order={order} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800">Failed to load order details</h2>
        <p className="text-sm text-red-600 mt-2">
          The order could not be retrieved. It may not exist or you may lack permissions.
        </p>
        <Link href="/admin/orders" className="mt-4 inline-block text-red-700 underline">
          Return to Orders
        </Link>
      </div>
    );
  }
}
