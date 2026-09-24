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
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl tracking-tight mb-3">Verify Identity</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          {otpSent
            ? `Code sent to ${email}`
            : "Sign in with a passcode"}
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-none" role="alert">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
              />
            </div>
            <Button type="submit" className="w-full rounded-none uppercase tracking-widest text-xs h-12 mt-4" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Sending...
                </>
              ) : (
                "Send Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-xs uppercase tracking-widest text-muted-foreground block text-center">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                required
                maxLength={6}
                className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 text-center text-3xl tracking-[0.5em] h-16 focus-visible:ring-0 focus-visible:border-foreground font-mono"
              />
            </div>
            <Button type="submit" className="w-full rounded-none uppercase tracking-widest text-xs h-12 mt-4" disabled={loading}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            
            <div className="text-center mt-6">
               <button 
                  type="button" 
                  onClick={handleRequestOTP} 
                  disabled={loading}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
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
