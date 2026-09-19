import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CancellationService } from '@/server/services/cancellation.service';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await AuthService.requireAuth(request.headers);
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const resolvedParams = await params;

    const body = await request.json().catch(() => ({}));
    const validated = cancelOrderSchema.parse(body);

    const cancellation = await CancellationService.cancelOrder(
      resolvedParams.orderId,
      session.id,
      UserRole.ADMIN,
      validated
    );

    return NextResponse.json(cancellation, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Admin cancel order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
