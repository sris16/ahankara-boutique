import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/utils/error-handler';
import { AppError } from '@/utils/errors';

export async function GET() {
  try {
    // Check database connection by executing a simple query
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      throw new AppError('Database connection failed', 503, 'SERVICE_UNAVAILABLE', dbError);
    }

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // If it's our AppError, we can format it differently for health or use handleError
    if (error instanceof AppError && error.code === 'SERVICE_UNAVAILABLE') {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
    return handleError(error);
  }
}
