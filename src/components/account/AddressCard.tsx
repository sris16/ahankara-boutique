"use client";

import { useState } from "react";
import { Address } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteAddressDialog } from "@/components/account/DeleteAddressDialog";
import { Pencil, Trash2, MapPin, CheckCircle2 } from "lucide-react";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => Promise<void> | void;
  onSetDefaultShipping: (id: string) => Promise<void> | void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefaultShipping,
  isDeleting,
  isSettingDefault,
}: AddressCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <div
        className={`border rounded-xs p-6 flex flex-col h-full bg-background transition-all duration-200 shadow-xs relative ${
          address.isDefaultShipping
            ? "border-foreground ring-1 ring-foreground/20"
            : "border-border/80 hover:border-foreground/40"
        }`}
      >
        {/* Top Header: Name, Type Badge & Default Status */}
        <div className="flex justify-between items-start gap-3 mb-4 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-base sm:text-lg tracking-tight text-foreground font-medium">
                {address.fullName}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider h-5 px-2">
                {address.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{address.phone}</p>
          </div>

          {address.isDefaultShipping && (
            <Badge variant="default" className="text-[10px] font-mono uppercase tracking-wider h-6 px-2.5 gap-1 shrink-0 bg-foreground text-background">
              <CheckCircle2 className="w-3 h-3 text-background" />
              Default
            </Badge>
          )}
        </div>

        {/* Address Lines */}
        <div className="text-xs text-muted-foreground flex-grow mb-6 space-y-1 leading-relaxed">
          <p className="text-foreground/90 font-medium">{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          {address.landmark && (
            <p className="text-[11px] text-muted-foreground/80 font-mono">
              Landmark: {address.landmark}
            </p>
          )}
          <p className="font-mono text-[11px] pt-1">
            {address.city}, {address.state} — {address.postalCode}
          </p>
          <p className="uppercase tracking-wider font-mono text-[10px] text-muted-foreground/70">
            {address.country}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-4 border-t border-border/60 mt-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xs h-9 text-[11px] uppercase tracking-wider font-medium"
              onClick={() => onEdit(address)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xs h-9 text-[11px] uppercase tracking-wider font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 transition-colors"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>

          {!address.isDefaultShipping && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xs h-8 text-[10px] uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground hover:bg-surface-muted/60"
              onClick={() => onSetDefaultShipping(address.id)}
              disabled={isSettingDefault}
            >
              <MapPin className="w-3 h-3 mr-1.5" />
              Set as Primary Address
            </Button>
          )}
        </div>
      </div>

      {/* Accessible Confirmation Dialog */}
      <DeleteAddressDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => onDelete(address.id)}
        isDeleting={isDeleting}
        addressLabel={`${address.fullName} (${address.addressLine1})`}
      />
    </>
  );
}

