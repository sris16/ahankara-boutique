import React from 'react';
import type { AdminOrder } from '@/types/admin';
import { CreditCard, Truck, Package, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function OrderSummaryCards({ order }: { order: AdminOrder }) {
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

  type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

  const getOrderStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'CONFIRMED': return 'default';
      case 'PROCESSING': return 'secondary';
      case 'SHIPPED': return 'outline';
      case 'DELIVERED': return 'default';
      case 'CANCELLED':
      case 'EXPIRED': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'PAID': return 'default';
      case 'FAILED': return 'destructive';
      case 'REFUNDED': return 'secondary';
      default: return 'outline';
    }
  };

  const getFulfillmentStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'DELIVERED': return 'default';
      case 'PARTIALLY_FULFILLED': return 'secondary';
      case 'FULFILLED': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Date Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Created At</p>
            <p className="text-sm font-semibold text-foreground">{formatDate(order.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Order Status</p>
            <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Payment Status</p>
            <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment Status Card */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="p-2 bg-muted rounded-lg shrink-0">
            <Truck className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Fulfillment</p>
            <Badge variant={getFulfillmentStatusVariant(order.fulfillmentStatus)}>{order.fulfillmentStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Total Amount Card */}
      <Card className="shadow-sm sm:col-span-2 lg:col-span-4 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-background rounded-lg shrink-0 shadow-sm">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider">Total Amount</p>
          </div>
          <p className="text-xl font-bold text-primary">{formatMoney(order.totalAmount)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
