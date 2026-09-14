import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { InventoryService } from '@/server/services/inventory.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ productId: string; variantId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, variantId } = await params;
    const body = await req.json();
    
    const result = await InventoryService.updateLowStockThreshold(productId, variantId, body);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
