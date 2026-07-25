import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/server/services/auth.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';

export async function GET(request: Request) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status');

    const shipments = await prisma.shipment.findMany({
      where: status ? { status: status as import('@prisma/client').ShipmentStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: { select: { orderNumber: true, user: { select: { name: true, email: true } } } },
        _count: { select: { items: true } }
      }
    });

    return NextResponse.json(shipments);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('List shipments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
