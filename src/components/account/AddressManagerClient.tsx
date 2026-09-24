"use client";

import { useState } from "react";
import { Address, CreateAddressInput } from "@/types/address";
import { addressApi } from "@/lib/api/address";
import { AddressForm } from "@/components/address/AddressForm";
import { AddressCard } from "@/components/account/AddressCard";
import { Button } from "@/components/ui/button";
import { Plus, MapPinOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddressManagerClientProps {
  initialAddresses: Address[];
}

export function AddressManagerClient({ initialAddresses }: AddressManagerClientProps) {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const refreshFromServer = async () => {
    try {
      // In a real SSR-first pattern, we either call router.refresh()
      // to let the Server Component re-fetch and pass new props,
      // or we fetch directly via API and update state.
      // We'll update state directly for instant feedback, then router.refresh() for safety.
      const freshData = await addressApi.getAddresses();
      setAddresses(freshData);
      router.refresh();
    } catch {
      setGlobalError("Failed to synchronize addresses.");
    }
  };

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (address: Address) => {
    setEditingAddress(address);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAddress(null);
    setFormError(null);
  };

  const handleSubmit = async (data: CreateAddressInput) => {
    setFormError(null);
    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, data);
      } else {
        await addressApi.createAddress(data);
      }
      await refreshFromServer();
      handleCloseForm();
    } catch (err: unknown) {
      const apiError = err as Error;
      setFormError(apiError.message || "Failed to save address.");
      throw err; // Re-throw so AddressForm doesn't clear loading state if it catches
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await addressApi.deleteAddress(id);
      await refreshFromServer();
    } catch (err: unknown) {
      const apiError = err as Error;
      setGlobalError(apiError.message || "Failed to delete address.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setProcessingId(id);
    try {
      await addressApi.setDefaultShipping(id);
      await refreshFromServer();
    } catch (err: unknown) {
      const apiError = err as Error;
      setGlobalError(apiError.message || "Failed to set default address.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl tracking-tight hidden md:block">Addresses</h2>
          <p className="text-muted-foreground mt-2">Manage your shipping and billing addresses.</p>
        </div>

        {!isFormOpen && (
          <Button onClick={handleOpenCreate} className="rounded-none h-12 px-6 uppercase tracking-widest text-xs font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        )}
      </div>

      {globalError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-none text-sm border border-destructive/20" aria-live="assertive">
          {globalError}
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-background border border-border/50 rounded-none p-6 md:p-8 max-w-3xl">
          <h3 className="font-serif text-xl tracking-tight mb-8">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>

          {formError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-none mb-8 text-sm border border-destructive/20" aria-live="assertive">
              {formError}
            </div>
          )}

          <AddressForm
            initialData={editingAddress}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={false} // AddressForm handles its own submission state now
          />
        </div>
      ) : (
        <>
          {addresses.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border border-border/50 rounded-none bg-background">
              <MapPinOff className="w-12 h-12 text-muted-foreground/50 mb-6" />
              <h2 className="font-serif text-2xl tracking-tight mb-3">No addresses found</h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-sm">You haven&apos;t saved any addresses yet.</p>
              <Button onClick={handleOpenCreate} className="rounded-none px-8">Add New Address</Button>
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
        </>
      )}
    </div>
  );
}
