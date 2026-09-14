import { apiClient } from "./client";
import type { User } from "@/hooks/use-auth";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export const accountApi = {
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>("/api/me");
  },
  
  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    return apiClient.patch<User>("/api/me", data);
  },
};
