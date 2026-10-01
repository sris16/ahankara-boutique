"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";
  const safeRedirect = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        if (signUpError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (signUpError.status === 409) {
          setError("An account with this email address already exists.");
        } else {
          setError(signUpError.message || "Failed to create account. Please check your inputs.");
        }
        setLoading(false);
        return;
      }

      await refresh();
      toast({
        title: "Welcome to AHANKARA STUDIOS",
        description: "Your account has been created successfully.",
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
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-2">Create Account</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Join the AHANKARA ATELIER clientele
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
          <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Victoria Sterling"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            autoComplete="name"
            className="h-11 rounded-xs"
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Password
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
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
            <Check className={`w-3 h-3 ${password.length >= 8 ? "text-accent" : "text-muted-foreground/40"}`} />
            <span className={password.length >= 8 ? "text-foreground font-medium" : "text-muted-foreground/70"}>
              Must be at least 8 characters
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-2">
          By registering, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11 mt-4 font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs">
        <p className="text-muted-foreground tracking-wide">
          Already an Atelier member?{" "}
          <Link
            href={callbackUrl !== "/" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
            className="text-foreground font-medium hover:text-accent transition-colors underline underline-offset-4 ml-1"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="default" className="mb-3" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Loading...</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

