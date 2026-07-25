import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { CancellationService } from '@/server/services/cancellation.service';
import { cancelOrderSchema } from '@/server/validators/cancellation.validator';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await AuthService.requireAuth(request.headers);
    const resolvedParams = await params;
    const body = await request.json();
    
    const validated = cancelOrderSchema.parse(body);

    const cancellation = await CancellationService.cancelOrder(
      resolvedParams.orderId,
      session.id,
      UserRole.CUSTOMER,
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
    console.error('Customer cancel order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
