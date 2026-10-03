"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddressForm } from "@/components/address/AddressForm";
import { CreateAddressInput } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface OnboardingClientProps {
  userName: string;
  redirectUrl: string;
}

export default function OnboardingClient({ userName, redirectUrl }: OnboardingClientProps) {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Split name to get first name
  const firstName = userName.split(" ")[0];

  const completeStep1 = async (phoneValue: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save phone number");
      }
      
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter a valid phone number or skip.");
      return;
    }
    await completeStep1(phone);
  };

  const handleAddressSubmit = async (data: CreateAddressInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.message || "Failed to save address");
      }
      
      // Onboarding complete, redirect to target
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleSkipAddress = () => {
    router.push(redirectUrl);
    router.refresh();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
          Welcome to AHANKARA STUDIOS, {firstName}
        </h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
          {step === 1 ? "Complete your profile" : "Add a delivery destination"}
        </p>
      </div>

      {error && (
        <div className="p-4 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xs flex items-center justify-center">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="p-6 sm:p-8 bg-surface border border-border/80 rounded-xs shadow-subtle flex flex-col gap-6">
          <div className="text-center mb-2">
            <h3 className="font-serif text-xl text-foreground mb-2">Contact Details</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please provide your primary contact number to receive essential delivery updates and concierge notifications.
            </p>
          </div>

          <div className="flex flex-col gap-2 max-w-sm mx-auto w-full">
            <Label htmlFor="phone" className="text-xs uppercase tracking-wider font-medium text-foreground text-center">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-xs text-center text-lg font-mono tracking-wider"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4 max-w-sm mx-auto w-full">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full uppercase tracking-[0.2em] text-xs h-11 rounded-xs"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save & Continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => completeStep1("")}
              disabled={isLoading}
              className="w-full uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <AddressForm 
            onSubmit={handleAddressSubmit}
            onCancel={handleSkipAddress}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
