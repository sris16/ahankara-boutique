import { Address } from "@/types/address";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, CheckCircle2 } from "lucide-react";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefaultShipping: (id: string) => void;
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
  return (
    <div className={`border rounded-none p-6 md:p-8 flex flex-col h-full bg-background transition-colors ${address.isDefaultShipping ? 'border-foreground' : 'border-border/50 hover:border-foreground/20'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
          <span className="font-serif text-lg tracking-tight flex items-center gap-3">
            {address.fullName}
            <span className="bg-transparent border border-border px-2 py-0.5 rounded-none text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {address.type}
            </span>
          </span>
          <span className="text-xs text-muted-foreground font-medium tracking-wide">{address.phone}</span>
        </div>
        
        {address.isDefaultShipping && (
          <span className="bg-foreground text-background px-3 py-1 rounded-none text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Default
          </span>
        )}
      </div>

      <div className="text-sm text-muted-foreground flex-grow mb-8 space-y-1.5 leading-relaxed">
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        {address.landmark && <p>Landmark: {address.landmark}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
      </div>

      <div className="flex items-center gap-4 pt-6 border-t border-border/40 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-none h-10 text-[10px] uppercase tracking-widest font-medium"
          onClick={() => onEdit(address)}
        >
          <Pencil className="w-3.5 h-3.5 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-none h-10 text-[10px] uppercase tracking-widest font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 transition-colors"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this address?")) {
              onDelete(address.id);
            }
          }}
          disabled={isDeleting}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </Button>
      </div>
      
      {!address.isDefaultShipping && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 rounded-none h-10 text-[10px] uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground"
          onClick={() => onSetDefaultShipping(address.id)}
          disabled={isSettingDefault}
        >
          <MapPin className="w-3.5 h-3.5 mr-2" />
          Set as Default
        </Button>
      )}
    </div>
  );
}
