"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

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

  // If no token is present, we show an error. Better Auth expects a token or reads it from the URL.
  // The token parameter is typically added by the reset link.
  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl tracking-tight mb-4 text-destructive">Invalid Link</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Button asChild variant="outline" className="w-full rounded-none uppercase tracking-widest text-xs h-12">
          <Link href="/forgot-password">Request New Link</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
      // Give the user a moment to see the success message before redirecting
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
      <div className="text-center animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
        </div>
        <h1 className="font-serif text-3xl tracking-tight mb-4">Password Reset</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Your password has been successfully updated. Redirecting to login...
        </p>
        <Button asChild variant="outline" className="w-full rounded-none uppercase tracking-widest text-xs h-12">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl tracking-tight mb-3">Reset Password</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-none" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Minimum 8 characters</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <Button type="submit" className="w-full rounded-none uppercase tracking-widest text-xs h-12 mt-4" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Saving...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" className="mb-4" />
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
