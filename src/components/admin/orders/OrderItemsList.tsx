import React from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';

export function OrderItemsList({ order, shipments }: { order: AdminOrder; shipments: AdminShipment[] }) {
  const formatMoney = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  const calculateFulfilledQuantity = (orderItemId: string) => {
    let fulfilled = 0;
    shipments.forEach(shipment => {
      if (shipment.status !== 'CANCELLED') {
        const item = shipment.items?.find(i => i.orderItemId === orderItemId);
        if (item) {
          fulfilled += item.quantity;
        }
      }
    });
    return fulfilled;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b px-6 py-4 bg-gray-50">
          <h3 className="font-medium text-gray-900">Order Items</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium text-center">Qty</th>
                <th className="px-6 py-3 font-medium text-center">Fulfilled</th>
                <th className="px-6 py-3 font-medium text-center">Unfulfilled</th>
                <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(order.items || []).map((item) => {
                const fulfilled = calculateFulfilledQuantity(item.id);
                const unfulfilled = Math.max(0, item.quantity - fulfilled);

                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span>SKU: {item.sku}</span>
                        {item.size && <span>• Size: {item.size}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                    <td className="px-6 py-4 text-center text-green-600">{fulfilled}</td>
                    <td className="px-6 py-4 text-center text-orange-600 font-semibold">{unfulfilled}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{formatMoney(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatMoney(item.lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b px-6 py-4 bg-gray-50">
          <h3 className="font-medium text-gray-900">Payment Summary</h3>
        </div>
        <div className="px-6 py-4 space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span>-{formatMoney(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>{formatMoney(order.shippingAmount)}</span>
          </div>
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatMoney(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-3 border-t">
            <span>Total</span>
            <span>{formatMoney(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
