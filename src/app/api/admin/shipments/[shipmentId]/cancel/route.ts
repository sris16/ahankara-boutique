import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const shipment = await ShippingService.cancelShipment(resolvedParams.shipmentId);

    return NextResponse.json(shipment);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Cancel shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
