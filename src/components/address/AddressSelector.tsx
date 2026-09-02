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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr.id;
          return (
            <div 
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={cn(
                "relative border rounded-sm p-4 cursor-pointer transition-colors",
                isSelected ? "border-foreground bg-muted/20" : "border-border hover:border-muted-foreground"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{addr.fullName}</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-muted px-2 py-0.5 rounded-sm">
                    {addr.type}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {addr.addressLine1}
                {addr.addressLine2 && <><br />{addr.addressLine2}</>}
                <br />
                {addr.city}, {addr.state} {addr.postalCode}
                <br />
                {addr.country}
              </p>
              <p className="text-sm mt-2">
                {addr.phone}
              </p>
            </div>
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
