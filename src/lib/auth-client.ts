import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  plugins: [
    emailOTPClient(),
  ],
});
