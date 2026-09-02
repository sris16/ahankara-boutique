"use client";

import { useState } from "react";
import { CreateAddressInput, Address } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input id="addressLine1" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input id="addressLine2" name="addressLine2" value={formData.addressLine2 || ''} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" value={formData.country} onChange={handleChange} required disabled />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <select 
            id="type" 
            name="type" 
            value={formData.type} 
            onChange={handleChange}
            className="flex h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="HOME">Home</option>
            <option value="WORK">Work</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input 
          type="checkbox" 
          id="isDefaultShipping" 
          name="isDefaultShipping" 
          checked={formData.isDefaultShipping} 
          onChange={handleChange} 
          className="rounded border-input text-foreground focus:ring-foreground"
        />
        <Label htmlFor="isDefaultShipping" className="text-sm font-normal">Set as default shipping address</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Save Changes" : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
