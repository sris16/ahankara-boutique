"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, MailCheck, AlertCircle } from "lucide-react";

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
        // Protect against email enumeration
        console.error("Forgot password notice:", resetError);
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
      <div className="text-center py-4 animate-in fade-in duration-300">
        <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
          <MailCheck className="w-5 h-5 text-accent" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-3">
          Check Your Inbox
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-mono">
          If an account exists for <span className="text-foreground font-medium">{email}</span>, a secure password renewal link has been dispatched.
        </p>
        <Button asChild variant="outline" className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11">
          <Link href="/login">Return to Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-2">Password Recovery</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Receive a secure credential reset link
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
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Account Email Address
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
              <Spinner size="sm" className="mr-2" /> Dispatching Link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs">
        <Link
          href="/login"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.18em] text-[11px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

