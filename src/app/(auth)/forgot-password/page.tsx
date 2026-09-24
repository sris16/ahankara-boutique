"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide an email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: resetError } = await (authClient as any).requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (resetError) {
        if (resetError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
          setLoading(false);
          return;
        }
        // For all other errors, we swallow them and show success to prevent email enumeration.
        console.error("Forget password error:", resetError);
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl tracking-tight mb-4">Check Your Email</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          If an account exists for this email address, you will receive a password reset link shortly.
        </p>
        <Button asChild variant="outline" className="w-full rounded-none uppercase tracking-widest text-xs h-12">
          <Link href="/login">Return to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl tracking-tight mb-3">Forgot Password</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          Enter your email address and we&apos;ll send you a secure password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-none" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

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
            autoComplete="email"
            className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <Button type="submit" className="w-full rounded-none uppercase tracking-widest text-xs h-12 mt-4" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Sending Link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-xs uppercase tracking-widest">
        <Link href="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3 mr-2" />
          Back to Sign In
        </Link>
      </div>
    </>
  );
}
