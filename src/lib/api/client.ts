import { ApiError, ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, timeoutMs = 15000, ...customConfig } = options;

  // 1. Fast-fail if explicitly offline in browser
  if (typeof window !== "undefined" && !navigator.onLine) {
    throw new ApiError("You are currently offline", 0, "NETWORK_ERROR");
  }

  let url = endpoint;
  if (!url.startsWith("http")) {
    const baseUrl = typeof window === "undefined" ? (BASE_URL || "http://localhost:3000") : "";
    url = `${baseUrl}${endpoint}`;
  }
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const isFormData = customConfig.body instanceof FormData;

  const config: RequestInit = {
    ...customConfig,
    // Ensures cookie-based session info is sent to the backend
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  };

  if (!isFormData && config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  let response: Response;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  let finalSignal = controller.signal;
  const callerSignal = customConfig.signal as AbortSignal | undefined;

  if (callerSignal) {
    const combined = new AbortController();
    finalSignal = combined.signal;
    const onCallerAbort = () => combined.abort(callerSignal.reason);
    const onTimeoutAbort = () => combined.abort(controller.signal.reason);

    if (callerSignal.aborted) onCallerAbort();
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true });

    if (controller.signal.aborted) onTimeoutAbort();
    else controller.signal.addEventListener("abort", onTimeoutAbort, { once: true });
  }

  try {
    response = await fetch(url, { ...config, signal: finalSignal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      if (callerSignal && callerSignal.aborted) {
        throw new ApiError("Request cancelled by caller", 0, "CALLER_ABORT");
      }
      throw new ApiError("Request timed out", 0, "TIMEOUT_ERROR");
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(id);
  }

  let data: ApiResponse<T>;
  try {
    // We expect the backend to return our standard ApiResponse format
    data = await response.json();
  } catch {
    throw new ApiError("Failed to parse API response", response.status, "PARSE_ERROR");
  }

  if (!response.ok || !data.success) {
    const errorMessage = data.message || data.error?.code || "An unexpected API error occurred";
    
    // Globally handle 401 Unauthorized for session expiration, 
    // but ignore the passive /api/me check so we don't redirect public visitors
    if (response.status === 401 && typeof window !== "undefined" && endpoint !== "/api/me") {
      window.dispatchEvent(new CustomEvent("ahankara:unauthorized"));
    }

    throw new ApiError(errorMessage, response.status, data.error?.code, data.error?.details);
  }

  return data.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "GET" }),
    
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "POST", body: data as BodyInit }),
    
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "PUT", body: data as BodyInit }),
    
  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "PATCH", body: data as BodyInit }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
