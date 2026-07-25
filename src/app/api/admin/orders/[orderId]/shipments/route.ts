import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ShippingService } from '@/server/services/shipping.service';
import { createShipmentSchema } from '@/server/validators/shipping.validator';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { z } from 'zod';
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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Create shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
        items: true,
        trackingEvents: {
          orderBy: { eventTime: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(shipments);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('List order shipments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
