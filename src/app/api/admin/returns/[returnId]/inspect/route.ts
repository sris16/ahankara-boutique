import { NextResponse } from 'next/server';
import { handleError } from "@/utils/error-handler";
import { AuthService } from '@/server/services/auth.service';
import { ReturnService } from '@/server/services/return.service';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const inspectPayloadSchema = z.object({
  items: z.array(z.object({
    returnItemId: z.string().uuid(),
    acceptedQuantity: z.number().int().min(0)
  })).min(1, 'At least one item must be inspected')
});

// BACKEND-ONLY API - intended to be called from Order Details UI
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

    return NextResponse.json({ success: true, data: updatedReturn });
  } catch (error) {
    return handleError(error);
  }
}
