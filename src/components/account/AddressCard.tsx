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
    <div className="border rounded-sm p-5 flex flex-col h-full bg-card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-medium flex items-center gap-2">
            {address.fullName}
            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider">
              {address.type}
            </span>
          </span>
          <span className="text-sm text-muted-foreground">{address.phone}</span>
        </div>
        
        {address.isDefaultShipping && (
          <span className="bg-foreground text-background px-2.5 py-1 rounded-sm text-xs font-medium tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Default
          </span>
        )}
      </div>

      <div className="text-sm text-muted-foreground flex-grow mb-6 space-y-1">
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        {address.landmark && <p>Landmark: {address.landmark}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(address)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this address?")) {
              onDelete(address.id);
            }
          }}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
      
      {!address.isDefaultShipping && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-muted-foreground hover:text-foreground"
          onClick={() => onSetDefaultShipping(address.id)}
          disabled={isSettingDefault}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Set as Default Shipping
        </Button>
      )}
    </div>
  );
}
