import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { UserRole } from '@prisma/client';

import { handleError } from '@/utils/error-handler';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const shipment = await ShippingService.assignAWB(resolvedParams.shipmentId);

    return NextResponse.json(shipment);
  } catch (error) {
    return handleError(error);
  }
}
