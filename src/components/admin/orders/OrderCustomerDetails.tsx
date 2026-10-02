import React from 'react';
import type { AdminOrder, AdminOrderAddress } from '@/types/admin';
import { User, MapPin, Mail, Phone, Map } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function OrderCustomerDetails({ order }: { order: AdminOrder }) {
  const renderAddress = (address: AdminOrderAddress | null | undefined) => {
    if (!address) {
      return (
        <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-md">
          Not provided
        </div>
      );
    }

    return (
      <div className="space-y-1 text-sm text-foreground bg-muted/10 p-4 rounded-md border shadow-sm">
        <p className="font-semibold">{address.name}</p>
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>{address.city}, {address.state} {address.postalCode}</p>
        <p>{address.country}</p>
        {address.landmark && (
          <p className="text-muted-foreground mt-2 text-xs flex items-center gap-1">
            <Map className="w-3 h-3" /> Landmark: {address.landmark}
          </p>
        )}
        <p className="mt-2 text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-muted">
          <Phone className="w-3.5 h-3.5" /> {address.phone}
        </p>
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <CardTitle className="flex items-center text-lg">
          <User className="w-5 h-5 text-muted-foreground mr-2" />
          Customer Information
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-lg">{order.user?.name || 'Guest Customer'}</p>
              {order.user?.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> {order.user.email}
                </p>
              )}
            </div>
            {!order.user && (
              <Badge variant="secondary">Guest</Badge>
            )}
            {order.user && (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Registered</Badge>
            )}
          </div>
        </div>

        <div className="border-t border-muted">
          <div className="px-6 py-4 flex items-center bg-muted/10">
            <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Shipping Address</h3>
          </div>
          <div className="px-6 pb-6 pt-2">
            {renderAddress(order.shippingAddress)}
          </div>
        </div>

        <div className="border-t border-muted">
          <div className="px-6 py-4 flex items-center bg-muted/10">
            <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Billing Address</h3>
          </div>
          <div className="px-6 pb-6 pt-2">
            {renderAddress(order.billingAddress)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
