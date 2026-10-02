'use client';

import React, { useState } from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentCreationDialog } from './ShipmentCreationDialog';
import { ShipmentCard } from './ShipmentCard';
import { Card, CardContent } from '@/components/ui/card';

export function ShipmentManager({ order, shipments }: { order: AdminOrder; shipments: AdminShipment[] }) {
  const [isCreating, setIsCreating] = useState(false);

  // Calculate if there's anything left to fulfill
  const hasUnfulfilledItems = (order.items || []).some(item => {
    let fulfilled = 0;
    shipments.forEach(s => {
      if (s.status !== 'CANCELLED') {
        const sItem = s.items?.find(si => si.orderItemId === item.id);
        if (sItem) fulfilled += sItem.quantity;
      }
    });
    return item.quantity - fulfilled > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center">
            <Package className="w-5 h-5 mr-2 text-muted-foreground" />
            Fulfillment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {shipments.length} {shipments.length === 1 ? 'shipment' : 'shipments'} created
          </p>
        </div>

        {order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && hasUnfulfilledItems && (
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Fulfill Items
          </Button>
        )}
      </div>

      {shipments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">No Shipments</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              This order currently has no shipments. Click &quot;Fulfill Items&quot; to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map(shipment => (
            <ShipmentCard key={shipment.id} shipment={shipment} order={order} />
          ))}
        </div>
      )}

      {isCreating && (
        <ShipmentCreationDialog
          order={order}
          shipments={shipments}
          onClose={() => setIsCreating(false)}
        />
      )}
    </div>
  );
}
