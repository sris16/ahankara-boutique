"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-3">
          Invalid Link
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-mono">
          This security link is invalid or has expired. Please request a new link to proceed.
        </p>
        <Button asChild variant="outline" className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11">
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: resetError } = await (authClient as any).resetPassword({
        newPassword: password,
        token: token,
      });

      if (resetError) {
        setError(resetError.message || "Failed to reset password. The link may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4 animate-in fade-in duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-3">
          Password Updated
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-mono">
          Your credentials have been securely updated. Redirecting to login...
        </p>
        <Button asChild variant="outline" className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-2">Reset Password</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Enter your new security credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 rounded-xs pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">Minimum 8 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
            autoComplete="new-password"
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
              <Spinner size="sm" className="mr-2" /> Saving Credentials...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="default" className="mb-3" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

