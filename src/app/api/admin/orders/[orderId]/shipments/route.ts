import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { createShipmentSchema } from '@/server/validators/shipping.validator';
import { UserRole } from '@prisma/client';


import { handleError } from '@/utils/error-handler';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const body = await request.json();
    const validated = createShipmentSchema.parse(body);

    const shipment = await ShippingService.createShipment(
      resolvedParams.orderId,
      validated.items,
      validated.provider
    );

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const shipments = await prisma.shipment.findMany({
      where: { orderId: resolvedParams.orderId },
      include: {
        items: {
          include: {
            orderItem: true
          }
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(shipments);
  } catch (error) {
    return handleError(error);
  }
}
