import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/server/services/auth.service';
import { AppError, UnauthorizedError } from '@/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await AuthService.requireAuth(request.headers);

    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.orderId },
      include: {
        shipments: {
          include: {
            items: {
              include: {
                orderItem: {
                  select: { productName: true, sku: true, quantity: true }
                }
              }
            },
            trackingEvents: {
              orderBy: { eventTime: 'desc' },
              select: { status: true, message: true, location: true, eventTime: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== user.id) {
      throw new UnauthorizedError('Not authorized to view tracking for this order');
    }

    // Expose only safe public tracking data
    const trackingResponse = {
      orderNumber: order.orderNumber,
      fulfillmentStatus: order.fulfillmentStatus,
      shipments: order.shipments.map(shipment => ({
        id: shipment.id,
        status: shipment.status,
        courierName: shipment.courierName,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        estimatedDeliveryAt: shipment.estimatedDeliveryAt,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        items: shipment.items.map(item => ({
          productName: item.orderItem.productName,
          sku: item.orderItem.sku,
          quantity: item.quantity
        })),
        trackingHistory: shipment.trackingEvents
      }))
    };

    return NextResponse.json(trackingResponse);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Get order tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
