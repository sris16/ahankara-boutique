import React from 'react';
import type { AdminOrder } from '@/types/admin';
import { CreditCard, Truck, Package, Clock } from 'lucide-react';

export function OrderSummaryCards({ order }: { order: AdminOrder }) {
  const formatMoney = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  const cards = [
    {
      label: 'Order Status',
      value: order.status,
      icon: <Clock className="w-5 h-5 text-gray-500" />,
      colorClass: order.status === 'CANCELLED' || order.status === 'EXPIRED' ? 'text-red-600' : 'text-gray-900',
    },
    {
      label: 'Payment Status',
      value: order.paymentStatus,
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      colorClass: order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-gray-900',
    },
    {
      label: 'Fulfillment Status',
      value: order.fulfillmentStatus,
      icon: <Truck className="w-5 h-5 text-indigo-500" />,
      colorClass: order.fulfillmentStatus === 'DELIVERED' ? 'text-green-600' :
                  order.fulfillmentStatus === 'PARTIALLY_FULFILLED' ? 'text-yellow-600' : 'text-gray-900',
    },
    {
      label: 'Total Amount',
      value: formatMoney(order.totalAmount),
      icon: <Package className="w-5 h-5 text-purple-500" />,
      colorClass: 'text-gray-900 font-bold',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border p-4 flex items-start space-x-4">
          <div className="p-2 bg-gray-50 rounded-lg">
            {card.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            <p className={`mt-1 text-lg font-semibold ${card.colorClass}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
