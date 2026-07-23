import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AuthService } from '@/server/services/auth.service';
import { updateCouponSchema } from '@/server/validators/coupon.validator';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { couponId: string } }
) {
  try {
    await AuthService.requireRole(request, UserRole.ADMIN);

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.couponId },
      include: {
        products: true,
        categories: true,
        collections: true,
        redemptions: {
          take: 10,
          orderBy: { redeemedAt: 'desc' }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { couponId: string } }
) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const body = await request.json();
    const validated = updateCouponSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { id: params.couponId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (validated.code && validated.code !== existing.code) {
      const conflict = await prisma.coupon.findUnique({
        where: { code: validated.code }
      });
      if (conflict) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
      }
    }

    const coupon = await prisma.$transaction(async (tx) => {
      if (validated.productIds !== undefined) {
        await tx.couponProduct.deleteMany({ where: { couponId: params.couponId } });
        if (validated.productIds.length > 0) {
          await tx.couponProduct.createMany({
            data: validated.productIds.map(id => ({ couponId: params.couponId, productId: id }))
          });
        }
      }

      if (validated.categoryIds !== undefined) {
        await tx.couponCategory.deleteMany({ where: { couponId: params.couponId } });
        if (validated.categoryIds.length > 0) {
          await tx.couponCategory.createMany({
            data: validated.categoryIds.map(id => ({ couponId: params.couponId, categoryId: id }))
          });
        }
      }

      if (validated.collectionIds !== undefined) {
        await tx.couponCollection.deleteMany({ where: { couponId: params.couponId } });
        if (validated.collectionIds.length > 0) {
          await tx.couponCollection.createMany({
            data: validated.collectionIds.map(id => ({ couponId: params.couponId, collectionId: id }))
          });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { productIds, categoryIds, collectionIds, ...updateData } = validated;

      return await tx.coupon.update({
        where: { id: params.couponId },
        data: updateData,
        include: {
          products: true,
          categories: true,
          collections: true,
        }
      });
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { couponId: string } }
) {
  try {
    await AuthService.requireRole(request, UserRole.ADMIN);

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.couponId },
      include: {
        _count: {
          select: { redemptions: true }
        }
      }
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    if (coupon._count.redemptions > 0) {
      // Deactivate instead of deleting to preserve audit history
      await prisma.coupon.update({
        where: { id: params.couponId },
        data: { isActive: false }
      });
      return NextResponse.json({ message: 'Coupon deactivated as it has existing redemptions' });
    }

    await prisma.coupon.delete({
      where: { id: params.couponId }
    });

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
