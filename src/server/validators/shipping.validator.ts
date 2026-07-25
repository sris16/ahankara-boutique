import { z } from 'zod';
import { ShippingProvider, ShipmentStatus } from '@prisma/client';

export const createShipmentItemSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().positive()
});

export const createShipmentSchema = z.object({
  provider: z.nativeEnum(ShippingProvider).default(ShippingProvider.MOCK),
  items: z.array(createShipmentItemSchema).min(1, 'Shipment must contain at least one item')
});

export const updateShipmentStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  message: z.string().optional(),
  location: z.string().optional()
});
