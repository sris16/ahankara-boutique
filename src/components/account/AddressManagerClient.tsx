"use client";

import { useState } from "react";
import { Address, CreateAddressInput } from "@/types/address";
import { addressApi } from "@/lib/api/address";
import { AddressForm } from "@/components/address/AddressForm";
import { AddressCard } from "@/components/account/AddressCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddressManagerClientProps {
  initialAddresses: Address[];
}

export function AddressManagerClient({ initialAddresses }: AddressManagerClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refreshFromServer = async () => {
    try {
      const freshData = await addressApi.getAddresses();
      setAddresses(freshData);
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Synchronization Error",
        description: "Failed to reload address book.",
      });
    }
  };

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (data: CreateAddressInput) => {
    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, data);
        toast({
          title: "Address Updated",
          description: "Your shipping destination has been revised.",
        });
      } else {
        await addressApi.createAddress(data);
        toast({
          title: "Address Saved",
          description: "New shipping destination added to your address book.",
        });
      }
      await refreshFromServer();
      handleCloseForm();
    } catch (err: unknown) {
      const apiError = err as Error;
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: apiError.message || "Failed to save address.",
      });
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await addressApi.deleteAddress(id);
      toast({
        title: "Address Deleted",
        description: "The address has been removed from your account.",
      });
      await refreshFromServer();
    } catch (err: unknown) {
      const apiError = err as Error;
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: apiError.message || "Failed to delete address.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setProcessingId(id);
    try {
      await addressApi.setDefaultShipping(id);
      toast({
        title: "Primary Destination Set",
        description: "Your default shipping address has been updated.",
      });
      await refreshFromServer();
    } catch (err: unknown) {
      const apiError = err as Error;
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: apiError.message || "Failed to update default address.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-mono block mb-1">
            CLIENT LOGISTICS
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
            Saved Addresses
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Manage your personal courier shipping and billing destinations.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xs h-11 px-5 uppercase tracking-[0.18em] text-xs font-medium shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {/* Address Grid or Empty State */}
      {addresses.length === 0 ? (
        <div className="bg-background border border-border/80 rounded-xs p-10 shadow-xs">
          <EmptyState
            icon={MapPin}
            title="No addresses recorded"
            description="Save your shipping and billing destinations for seamless atelier checkouts."
            action={{
              label: "Add New Address",
              onClick: handleOpenCreate,
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onSetDefaultShipping={handleSetDefault}
              isDeleting={processingId === address.id}
              isSettingDefault={processingId === address.id}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Address Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border/80 rounded-xs p-6 sm:p-8 shadow-lg">
          <DialogHeader className="mb-4 pb-3 border-b border-border/60">
            <DialogTitle className="font-serif text-xl sm:text-2xl tracking-tight text-foreground">
              {editingAddress ? "Edit Destination Address" : "Add Destination Address"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              Provide delivery details for verified insured courier delivery.
            </DialogDescription>
          </DialogHeader>

          <AddressForm
            initialData={editingAddress}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

