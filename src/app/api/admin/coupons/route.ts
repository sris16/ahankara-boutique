import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AuthService } from '@/server/services/auth.service';
import { createCouponSchema } from '@/server/validators/coupon.validator';
import { AppError } from '@/utils/errors';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { redemptions: true }
        }
      }
    });

    return NextResponse.json(coupons);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const body = await request.json();
    const validated = createCouponSchema.parse(body);

    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code }
    });

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        value: validated.value,
        minimumOrderAmount: validated.minimumOrderAmount,
        maximumDiscountAmount: validated.maximumDiscountAmount,
        usageLimit: validated.usageLimit,
        usageLimitPerUser: validated.usageLimitPerUser,
        isActive: validated.isActive,
        startsAt: validated.startsAt,
        endsAt: validated.endsAt,
        products: validated.productIds ? {
          create: validated.productIds.map(id => ({ productId: id }))
        } : undefined,
        categories: validated.categoryIds ? {
          create: validated.categoryIds.map(id => ({ categoryId: id }))
        } : undefined,
        collections: validated.collectionIds ? {
          create: validated.collectionIds.map(id => ({ collectionId: id }))
        } : undefined,
      },
      include: {
        products: true,
        categories: true,
        collections: true,
      }
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
