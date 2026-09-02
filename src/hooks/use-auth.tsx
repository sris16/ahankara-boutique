"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/types/api";

// This mirrors the AuthenticatedUser from auth.service.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isSuspended: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);

  const fetchSession = async (isInitial = false) => {
    try {
      if (!isInitial) {
        setLoading(true);
      }
      setError(null);
      setIsSuspended(false);
      
      const userData = await apiClient.get<User>("/api/me");
      setUser(userData);
    } catch (err) {
      setUser(null);
      
      if (err instanceof ApiError) {
        // If it's a 401, they just aren't logged in.
        if (err.status !== 401) {
          setError(err.message);
          
          // The backend throws 403 Forbidden with specific messages for Suspended/Deactivated accounts
          if (err.status === 403 && err.message.toLowerCase().includes("suspended")) {
            setIsSuspended(true);
          }
        }
      } else {
        setError("An unexpected error occurred while fetching the session.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSession(true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, isSuspended, refresh: fetchSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
