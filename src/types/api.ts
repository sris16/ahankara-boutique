/**
 * Standardized API response type matching the backend's `api-response.ts` structure.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

/**
 * Standard custom error thrown by the API client.
 */
export class ApiError extends Error {
  public code?: string;
  public details?: unknown;
  public status: number;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
