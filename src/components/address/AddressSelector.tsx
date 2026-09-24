"use client";

import { Address } from "@/types/address";
import { cn } from "@/lib/utils";
import { Check, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

export function AddressSelector({ addresses, selectedId, onSelect, onAddNew, isLoading }: AddressSelectorProps) {
  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="border border-dashed rounded-sm p-8 text-center flex flex-col items-center gap-4">
        <MapPin className="w-8 h-8 text-muted-foreground" />
        <div>
          <h3 className="font-medium text-lg">No saved addresses</h3>
          <p className="text-muted-foreground text-sm mt-1">Please add a shipping address to continue.</p>
        </div>
        <Button onClick={onAddNew} variant="outline" className="mt-2">
          Add New Address
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" role="group" aria-label="Select an address">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr.id;
          return (
            <button
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative border rounded-sm p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2",
                isSelected
                  ? "border-foreground bg-muted/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/60 bg-background"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-base tracking-tight">{addr.fullName}</span>
                  <span className="text-[10px] font-medium tracking-widest uppercase bg-muted/50 px-2 py-0.5 rounded-sm text-muted-foreground">
                    {addr.type}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-foreground shrink-0" aria-label="Selected" />
                )}
              </div>
              <address className="text-sm text-muted-foreground leading-relaxed not-italic space-y-1">
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.country}</p>
              </address>
              <p className="text-sm mt-4 font-medium tracking-wide">
                {addr.phone}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <Button onClick={onAddNew} variant="outline" className="w-full md:w-auto">
          + Add New Address
        </Button>
      </div>
    </div>
  );
}
