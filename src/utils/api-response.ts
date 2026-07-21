import { NextResponse } from 'next/server';

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    } as SuccessResponse<T>,
    { status }
  );
}

export function errorResponse(message: string, code: string, details?: unknown, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code,
        ...(details && process.env.NODE_ENV !== 'production' ? { details } : {}),
      },
    } as ErrorResponse,
    { status }
  );
}
