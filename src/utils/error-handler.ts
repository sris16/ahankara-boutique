import { ZodError } from 'zod';
import { AppError } from './errors';
import { errorResponse } from './api-response';

export function handleError(error: unknown) {
  // Application specific errors
  if (error instanceof AppError) {
    return errorResponse(error.message, error.code, error.details, error.statusCode);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse('Validation failed', 'VALIDATION_ERROR', error.format(), 400);
  }

  // Prisma errors can be handled here if needed (e.g. unique constraint violation)
  // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }

  // Generic unhandled errors
  console.error('Unhandled Exception:', error);
  return errorResponse(
    'Internal server error',
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'development' ? error : undefined,
    500
  );
}
