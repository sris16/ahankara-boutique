import { ApiError, ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = endpoint;
  if (!url.startsWith("http")) {
    const baseUrl = BASE_URL || (typeof window === "undefined" ? "http://localhost:3000" : "");
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
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      "NETWORK_ERROR"
    );
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
