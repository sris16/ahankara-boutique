import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { InventoryService } from '@/server/services/inventory.service';
import { UserRole } from '@prisma/client';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const lowStock = await InventoryService.getLowStockVariants();
    return successResponse(lowStock);
  } catch (error) {
    return handleError(error);
  }
}
