import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const shipment = await prisma.shipment.findUnique({
      where: { id: resolvedParams.shipmentId },
      include: {
        order: { select: { orderNumber: true, status: true, paymentStatus: true, fulfillmentStatus: true } },
        items: {
          include: {
            orderItem: true
          }
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' }
        }
      }
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Get shipment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
