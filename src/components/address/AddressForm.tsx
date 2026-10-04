"use client";

import { useState } from "react";
import { CreateAddressInput, Address } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { INDIAN_STATES_AND_UTS, INDIAN_CITIES_BY_STATE } from "@/data/indiaLocations";

interface AddressFormProps {
  initialData?: Address | null;
  onSubmit: (data: CreateAddressInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddressForm({ initialData, onSubmit, onCancel, isLoading }: AddressFormProps) {
  const [formData, setFormData] = useState<CreateAddressInput>({
    fullName: initialData?.fullName || "",
    phone: initialData?.phone || "",
    addressLine1: initialData?.addressLine1 || "",
    addressLine2: initialData?.addressLine2 || "",
    landmark: initialData?.landmark || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postalCode: initialData?.postalCode || "",
    country: initialData?.country || "India",
    type: initialData?.type || "HOME",
    isDefaultShipping: initialData?.isDefaultShipping || false,
    isDefaultBilling: initialData?.isDefaultBilling || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isLoading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 sm:p-8 bg-surface border border-border/80 rounded-xs shadow-subtle flex flex-col gap-6"
    >
      <div className="border-b border-border/50 pb-4">
        <h3 className="font-serif text-lg font-normal tracking-wide text-foreground">
          {initialData ? "Edit Destination Address" : "New Atelier Destination"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter precise delivery information for insured courier dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName" className="text-xs uppercase tracking-wider font-medium text-foreground">
            Recipient Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="e.g. Eleanor Vance"
            value={formData.fullName}
            onChange={handleChange}
            required
            disabled={disabled}
            className="h-11 rounded-xs text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone" className="text-xs uppercase tracking-wider font-medium text-foreground">
            Contact Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={disabled}
            className="h-11 rounded-xs text-sm font-mono"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="addressLine1" className="text-xs uppercase tracking-wider font-medium text-foreground">
          Street Address / Residence <span className="text-destructive">*</span>
        </Label>
        <Input
          id="addressLine1"
          name="addressLine1"
          placeholder="Building name, apartment number, street name"
          value={formData.addressLine1}
          onChange={handleChange}
          required
          disabled={disabled}
          className="h-11 rounded-xs text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="addressLine2" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            Suite / Unit / Floor (Optional)
          </Label>
          <Input
            id="addressLine2"
            name="addressLine2"
            placeholder="Floor, suite, or flat number"
            value={formData.addressLine2 || ""}
            onChange={handleChange}
            disabled={disabled}
            className="h-11 rounded-xs text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="landmark" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            Notable Landmark (Optional)
          </Label>
          <Input
            id="landmark"
            name="landmark"
            placeholder="Near landmark or prominent point"
            value={formData.landmark || ""}
            onChange={handleChange}
            disabled={disabled}
            className="h-11 rounded-xs text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city" className="text-xs uppercase tracking-wider font-medium text-foreground">
            City <span className="text-destructive">*</span>
          </Label>
          <Combobox
            id="city"
            name="city"
            placeholder="City or district"
            value={formData.city}
            onValueChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
            options={(() => {
              if (!formData.state) return [];
              const stateKey = Object.keys(INDIAN_CITIES_BY_STATE).find(k => k.toLowerCase() === formData.state.toLowerCase());
              return stateKey ? INDIAN_CITIES_BY_STATE[stateKey] : [];
            })()}
            emptyMessage={!formData.state ? "Select a state first" : "No city suggestions available — you can type your city manually."}
            required
            disabled={disabled}
            className="font-sans"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="state" className="text-xs uppercase tracking-wider font-medium text-foreground">
            State / Province <span className="text-destructive">*</span>
          </Label>
          <Combobox
            id="state"
            name="state"
            placeholder="State"
            value={formData.state}
            onValueChange={(val) => {
              // Clear city if state changes to a completely different valid state and current city is not in new state
              setFormData(prev => {
                if (val !== prev.state) {
                  const stateKey = Object.keys(INDIAN_CITIES_BY_STATE).find(k => k.toLowerCase() === val.toLowerCase());
                  const newCities = stateKey ? INDIAN_CITIES_BY_STATE[stateKey] : [];
                  
                  if (prev.city && newCities.length > 0 && !newCities.includes(prev.city)) {
                    return { ...prev, state: val, city: "" };
                  }
                }
                return { ...prev, state: val };
              });
            }}
            options={INDIAN_STATES_AND_UTS}
            required
            disabled={disabled}
            className="font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="postalCode" className="text-xs uppercase tracking-wider font-medium text-foreground">
            PIN / Postal Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="postalCode"
            name="postalCode"
            placeholder="6-digit PIN"
            value={formData.postalCode}
            onChange={handleChange}
            required
            disabled={disabled}
            maxLength={6}
            pattern="\d{6}"
            title="PIN code must be exactly 6 digits"
            className="h-11 rounded-xs text-sm font-mono tracking-wider"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="country" className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            Country
          </Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            disabled
            className="h-11 rounded-xs text-sm bg-surface-muted/60 opacity-80"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type" className="text-xs uppercase tracking-wider font-medium text-foreground">
            Address Type
          </Label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={disabled}
            className="flex h-11 w-full rounded-xs border border-border/80 bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer font-sans"
          >
            <option value="HOME">Home</option>
            <option value="WORK">Work</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <input
          type="checkbox"
          id="isDefaultShipping"
          name="isDefaultShipping"
          checked={formData.isDefaultShipping}
          onChange={handleChange}
          disabled={disabled}
          className="h-4 w-4 rounded-xs border-border/80 text-primary focus:ring-primary cursor-pointer"
        />
        <Label htmlFor="isDefaultShipping" className="text-xs text-muted-foreground font-normal cursor-pointer select-none">
          Set as my default delivery destination
        </Label>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={disabled}
          className="uppercase tracking-[0.2em] text-xs h-11 px-6 rounded-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={disabled}
          className="uppercase tracking-[0.2em] text-xs h-11 px-8 rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
        >
          {disabled ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{initialData ? "Update Address" : "Save Destination"}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
