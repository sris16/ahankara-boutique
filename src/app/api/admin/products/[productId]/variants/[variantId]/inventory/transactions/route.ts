import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { InventoryService } from '@/server/services/inventory.service';
import { UserRole } from '@prisma/client';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ productId: string; variantId: string }> }) {
  try {
    await AuthService.requireRole(req.headers, UserRole.ADMIN);
    const { productId, variantId } = await params;
    const { searchParams } = new URL(req.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Safety cap
    const safeLimit = Math.min(limit, 100);

    const result = await InventoryService.getInventoryTransactions(productId, variantId, page, safeLimit);
    return NextResponse.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(error);
  }
}
