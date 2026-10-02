import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { updateShipmentStatusSchema } from '@/server/validators/shipping.validator';
import { UserRole } from '@prisma/client';


import { handleError } from '@/utils/error-handler';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const body = await request.json();
    const validated = updateShipmentStatusSchema.parse(body);

    const shipment = await ShippingService.processTrackingEvent(resolvedParams.shipmentId, {
      providerEventId: `manual_${Date.now()}`,
      status: validated.status,
      message: validated.message || 'Manual status update',
      location: validated.location,
      eventTime: new Date()});

    return NextResponse.json(shipment);
  } catch (error) {
    return handleError(error);
  }
}
