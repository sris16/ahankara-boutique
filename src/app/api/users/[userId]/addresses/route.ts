import { NextRequest } from 'next/server';
import { AddressService } from '@/server/services/address.service';
import { handleError } from '@/utils/error-handler';
import { successResponse } from '@/utils/api-response';

// Note: These endpoints currently accept userId as a URL parameter for Version 2 domain testing.
// In Version 3, authentication middleware will enforce session identity instead of trusting the URL.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const addresses = await AddressService.getUserAddresses(userId);
    return successResponse(addresses);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await req.json();
    const address = await AddressService.createAddress(userId, body);
    return successResponse(address, 'Address created successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}
