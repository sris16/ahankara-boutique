"use client";

import { Address } from "@/types/address";
import { cn } from "@/lib/utils";
import { Check, Plus, Loader2, Home, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  isLoading?: boolean;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  isLoading,
}: AddressSelectorProps) {
  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="border border-dashed border-border/80 rounded-xs p-8 text-center flex flex-col items-center gap-4 bg-surface/50">
        <div className="w-12 h-12 rounded-full bg-surface-muted flex items-center justify-center text-muted-foreground">
          <MapPin className="w-6 h-6 stroke-[1.5]" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-normal tracking-wide text-foreground">
            No saved addresses
          </h3>
          <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
            Please add an atelier shipping destination to proceed with your order.
          </p>
        </div>
        <Button
          type="button"
          onClick={onAddNew}
          variant="outline"
          className="uppercase tracking-[0.2em] text-xs h-10 px-6 rounded-xs"
        >
          Add Delivery Address
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" role="group" aria-label="Select an address">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(addr.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative border rounded-xs p-5 text-left transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex flex-col justify-between min-h-[160px]",
                isSelected
                  ? "border-primary bg-surface shadow-subtle ring-1 ring-primary/20"
                  : "border-border/70 hover:border-primary/50 bg-surface/60 hover:bg-surface"
              )}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground tracking-tight">
                      {addr.fullName}
                    </span>
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className="text-[9px] uppercase tracking-wider py-0.5 px-1.5 font-mono"
                    >
                      {addr.type === "WORK" ? (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" /> Work
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Home className="w-2.5 h-2.5" /> Home
                        </span>
                      )}
                    </Badge>
                    {addr.isDefaultShipping && (
                      <span className="text-[9px] uppercase tracking-widest text-accent font-medium font-mono">
                        Default
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" aria-label="Selected" />
                    </div>
                  )}
                </div>

                <address className="text-xs text-muted-foreground leading-relaxed not-italic space-y-0.5">
                  <p className="line-clamp-1">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="line-clamp-1">{addr.addressLine2}</p>}
                  <p>
                    {addr.city}, {addr.state} <span className="font-mono">{addr.postalCode}</span>
                  </p>
                  <p className="uppercase tracking-wider text-[10px] text-muted-foreground/80">{addr.country}</p>
                </address>
              </div>

              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">{addr.phone}</span>
                <span className={cn("text-[11px] uppercase tracking-wider font-medium", isSelected ? "text-primary font-semibold" : "text-muted-foreground/60")}>
                  {isSelected ? "Delivering Here" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <Button
          type="button"
          onClick={onAddNew}
          variant="outline"
          className="uppercase tracking-[0.2em] text-xs h-11 px-5 border-dashed border-border/90 hover:border-primary rounded-xs flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Address</span>
        </Button>
      </div>
    </div>
  );
}
