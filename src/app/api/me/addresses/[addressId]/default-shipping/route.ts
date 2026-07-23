import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { AddressService } from '@/server/services/address.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const { addressId } = await params;
    const address = await AddressService.setDefaultShipping(addressId, user.id);
    return successResponse(address, 'Default shipping address updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
