"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in"
      });

      if (sendError) {
        if (sendError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(sendError.message || "Failed to send OTP.");
        }
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (verifyError) {
        if (verifyError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(verifyError.message || "Invalid or expired verification code.");
        }
        setLoading(false);
        return;
      }

      await refresh();
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold">Verify Identity</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {otpSent
            ? `We've sent a 6-digit code to ${email}`
            : "Sign in with a one-time passcode."}
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                required
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            
            <div className="text-center">
               <button 
                  type="button" 
                  onClick={handleRequestOTP} 
                  disabled={loading}
                  className="text-sm text-primary hover:underline"
               >
                  Resend Code
               </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
