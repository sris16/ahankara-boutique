import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { AddressService } from '@/server/services/address.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const { addressId } = await params;
    const address = await AddressService.getAddressById(addressId, user.id);
    return successResponse(address);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const { addressId } = await params;
    const body = await req.json();
    const address = await AddressService.updateAddress(addressId, user.id, body);
    return successResponse(address, 'Address updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const { addressId } = await params;
    await AddressService.deleteAddress(addressId, user.id);
    return successResponse(null, 'Address deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
