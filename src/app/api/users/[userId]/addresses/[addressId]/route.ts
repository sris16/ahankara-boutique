import { NextRequest } from 'next/server';
import { AddressService } from '@/server/services/address.service';
import { handleError } from '@/utils/error-handler';
import { successResponse } from '@/utils/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params;
    const address = await AddressService.getAddressById(addressId, userId);
    return successResponse(address);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params;
    const body = await req.json();
    const address = await AddressService.updateAddress(addressId, userId, body);
    return successResponse(address, 'Address updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params;
    await AddressService.deleteAddress(addressId, userId);
    return successResponse(null, 'Address deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
