import { NextRequest } from 'next/server';
import { AuthService } from '@/server/services/auth.service';
import { AddressService } from '@/server/services/address.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const addresses = await AddressService.getUserAddresses(user.id);
    return successResponse(addresses);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireAuth(req.headers);
    const body = await req.json();
    const address = await AddressService.createAddress(user.id, body);
    return successResponse(address, 'Address created successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}
