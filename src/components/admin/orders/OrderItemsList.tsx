import React from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Receipt } from 'lucide-react';

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
      {/* Order Items */}
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <CardTitle className="flex items-center text-lg">
            <ShoppingBag className="w-5 h-5 text-muted-foreground mr-2" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-muted">
            {(order.items || []).map((item) => {
              const fulfilled = calculateFulfilledQuantity(item.id);
              const unfulfilled = Math.max(0, item.quantity - fulfilled);

              return (
                <div key={item.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between">

                    {/* Item Identity */}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-foreground">{item.productName}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded-sm text-foreground/80">{item.sku}</span>
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                    </div>

                    {/* Fulfillment Status & Qty */}
                    <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1 w-full sm:w-auto items-center sm:items-end bg-muted/20 sm:bg-transparent p-3 sm:p-0 rounded-md">
                      <div className="text-sm font-medium mr-auto sm:mr-0">
                        Qty: {item.quantity}
                      </div>
                      <div className="flex gap-2">
                        {fulfilled > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Fulfilled: {fulfilled}
                          </Badge>
                        )}
                        {unfulfilled > 0 && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Unfulfilled: {unfulfilled}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex justify-between sm:flex-col w-full sm:w-auto text-right sm:text-right border-t sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0 items-center sm:items-end">
                      <div className="text-sm text-muted-foreground sm:mb-1 text-left sm:text-right">
                        {formatMoney(item.unitPrice)} <span className="text-xs">each</span>
                      </div>
                      <div className="font-semibold text-foreground">
                        {formatMoney(item.lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card className="shadow-sm border-primary/10 bg-primary/5">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
          <CardTitle className="flex items-center text-lg text-primary">
            <Receipt className="w-5 h-5 mr-2" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">{formatMoney(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-2">
                  Discount
                  {order.couponCode && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">
                      {order.couponCode}
                    </Badge>
                  )}
                </span>
                <span className="font-medium">-{formatMoney(order.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-medium text-foreground">{formatMoney(order.shippingAmount)}</span>
            </div>

            {order.taxAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-medium text-foreground">{formatMoney(order.taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-foreground text-lg pt-4 mt-2 border-t border-primary/10">
              <span>Total</span>
              <span>{formatMoney(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
