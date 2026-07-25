import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { updateShipmentStatusSchema } from '@/server/validators/shipping.validator';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { z } from 'zod';

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
      eventTime: new Date(),
    });

    return NextResponse.json(shipment);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Update shipment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
