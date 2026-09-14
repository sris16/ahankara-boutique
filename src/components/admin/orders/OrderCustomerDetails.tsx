import React from 'react';
import type { AdminOrder, AdminOrderAddress } from '@/types/admin';
import { User, MapPin } from 'lucide-react';

export function OrderCustomerDetails({ order }: { order: AdminOrder }) {
  const renderAddress = (title: string, address: AdminOrderAddress | null | undefined) => {
    if (!address) {
      return (
        <div className="text-sm text-gray-500 italic">No {title.toLowerCase()} provided.</div>
      );
    }

    return (
      <div className="space-y-1 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">{address.name}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{address.city}, {address.state} {address.postalCode}</p>
        <p>{address.country}</p>
        {address.landmark && <p className="text-gray-500 mt-1">Landmark: {address.landmark}</p>}
        <p className="mt-2 text-gray-600">Phone: {address.phone}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="border-b px-6 py-4 flex items-center bg-gray-50">
        <User className="w-5 h-5 text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-900">Customer</h3>
      </div>
      <div className="px-6 py-4">
        {order.user ? (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{order.user.name || 'Guest'}</p>
            <p className="text-sm text-gray-500">{order.user.email}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Guest Customer</p>
        )}
      </div>

      <div className="border-t border-gray-100">
        <div className="border-b px-6 py-4 flex items-center bg-gray-50">
          <MapPin className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">Shipping Address</h3>
        </div>
        <div className="px-6 py-4">
          {renderAddress('Shipping Address', order.shippingAddress)}
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="border-b px-6 py-4 flex items-center bg-gray-50">
          <MapPin className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">Billing Address</h3>
        </div>
        <div className="px-6 py-4">
          {renderAddress('Billing Address', order.billingAddress)}
        </div>
      </div>
    </div>
  );
}
