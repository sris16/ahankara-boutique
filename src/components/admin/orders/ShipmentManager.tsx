'use client';

import React, { useState } from 'react';
import type { AdminOrder, AdminShipment } from '@/types/admin';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShipmentCreationDialog } from './ShipmentCreationDialog';
import { ShipmentCard } from './ShipmentCard';

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Fulfillment
        </h2>
        
        {order.status !== 'CANCELLED' && order.status !== 'EXPIRED' && hasUnfulfilledItems && (
          <Button 
            onClick={() => setIsCreating(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Fulfill Items
          </Button>
        )}
      </div>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          No shipments created for this order yet.
        </div>
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
