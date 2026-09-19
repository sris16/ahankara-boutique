import { NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { ReturnService } from '@/server/services/return.service';
import { UserRole } from '@prisma/client';
import { AppError } from '@/utils/errors';
import { z } from 'zod';

const inspectPayloadSchema = z.object({
  items: z.array(z.object({
    returnItemId: z.string().uuid(),
    acceptedQuantity: z.number().int().min(0)
  })).min(1, 'At least one item must be inspected')
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ returnId: string }> }
) {
  try {
    const resolvedParams = await params;
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const body = await request.json();
    const validated = inspectPayloadSchema.parse(body);

    const updatedReturn = await ReturnService.inspectAndAcceptReturn(
      resolvedParams.returnId,
      validated.items
    );

    return NextResponse.json(updatedReturn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Inspect return error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
