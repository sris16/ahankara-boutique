import { NextRequest } from 'next/server';
import { AddressService } from '@/server/services/address.service';
import { handleError } from '@/utils/error-handler';
import { successResponse } from '@/utils/api-response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params;
    const address = await AddressService.setDefaultShipping(addressId, userId);
    return successResponse(address, 'Default shipping address updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
