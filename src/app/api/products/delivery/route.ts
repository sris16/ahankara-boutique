import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShippingService } from '@/server/services/shipping.service';
import { successResponse } from '@/utils/api-response';
import { handleError } from '@/utils/error-handler';
import { ValidationError } from '@/utils/errors';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const postalCode = searchParams.get('postalCode');
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');

    if (!postalCode) {
      throw new ValidationError('Postal code is required');
    }

    if (!/^\d{6}$/.test(postalCode)) {
      throw new ValidationError('Invalid postal code format');
    }

    if (!productId && !variantId) {
      throw new ValidationError('Product ID or Variant ID is required');
    }

    let weightInGrams = 500;
    let subtotal = 0;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true }
      });
      if (!variant) throw new ValidationError('Invalid variant ID');
      weightInGrams = variant.weightInGrams ?? 500;
      subtotal = variant.price ?? variant.product.basePrice;
    } else if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: { take: 1 } }
      });
      if (!product) throw new ValidationError('Invalid product ID');

      const defaultVariant = product.variants[0];
      if (defaultVariant) {
        weightInGrams = defaultVariant.weightInGrams ?? 500;
        subtotal = defaultVariant.price ?? product.basePrice;
      } else {
        weightInGrams = 500;
        subtotal = product.basePrice;
      }
    }

    const rates = await ShippingService.getRatesByPostalCode(
      postalCode,
      weightInGrams,
      subtotal
    );

    return successResponse({
      isServiceable: rates.isServiceable,
      shippingAmount: rates.shippingAmount,
      estimatedDeliveryAt: rates.estimatedDeliveryAt ? rates.estimatedDeliveryAt.toISOString() : null,
    });
  } catch (error) {
    return handleError(error);
  }
}
