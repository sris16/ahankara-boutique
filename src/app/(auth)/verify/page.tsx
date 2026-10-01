"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, ArrowLeft, KeyRound } from "lucide-react";

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";
  const safeRedirect = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (sendError) {
        if (sendError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(sendError.message || "Failed to send verification code.");
        }
        setLoading(false);
        return;
      }

      setOtpSent(true);
      setResendCooldown(60);
      toast({
        title: "Passcode Dispatched",
        description: `A 6-digit verification code has been sent to ${email}.`,
      });
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await authClient.signIn.emailOtp({
        email,
        otp: cleanOtp,
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
      toast({
        title: "Identity Verified",
        description: "Welcome to AHANKARA STUDIOS.",
      });
      router.push(safeRedirect);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/5 border border-border/80 flex items-center justify-center mb-3">
          <KeyRound className="w-4 h-4 text-foreground" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-2">
          {otpSent ? "Enter Passcode" : "Passcode Sign In"}
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          {otpSent ? `Sent to ${email}` : "Instant passwordless authentication"}
        </p>
      </div>

      <div className="space-y-5">
        {error && (
          <div
            className="p-3.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="client@atelier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                className="h-11 rounded-xs"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11 mt-2 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Dispatching Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium block text-center">
                6-Digit Security Code
              </Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••••"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                }}
                disabled={loading}
                required
                maxLength={6}
                autoFocus
                className="h-14 rounded-xs text-center text-2xl tracking-[0.6em] font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11 font-medium"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" /> Verifying...
                </>
              ) : (
                "Verify & Enter"
              )}
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError(null);
                }}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground transition-colors text-[11px] uppercase tracking-wider inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Change Email
              </button>

              {resendCooldown > 0 ? (
                <span className="text-muted-foreground text-[11px] font-mono">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOTP()}
                  disabled={loading}
                  className="text-foreground hover:text-accent font-medium text-[11px] uppercase tracking-wider underline underline-offset-4 transition-colors"
                >
                  Resend Code
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs">
        <Link
          href={callbackUrl !== "/" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.18em] text-[11px]"
        >
          ← Return to password sign in
        </Link>
      </div>
    </>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="default" className="mb-3" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Loading...</p>
        </div>
      }
    >
      <VerifyOTPForm />
    </Suspense>
  );
}

