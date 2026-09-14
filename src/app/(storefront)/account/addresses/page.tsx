"use client";

import { useState } from "react";
import { useAddress } from "@/hooks/use-address";
import { Address, CreateAddressInput } from "@/types/address";
import { AddressForm } from "@/components/address/AddressForm";
import { AddressCard } from "@/components/account/AddressCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MapPinOff } from "lucide-react";

export default function AddressesPage() {
  const {
    addresses,
    isLoading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultShipping,
  } = useAddress();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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
        await updateAddress(editingAddress.id, data);
      } else {
        await createAddress(data);
      }
      handleCloseForm();
    } catch (err: unknown) {
      const apiError = err as Error;
      setFormError(apiError.message || "Failed to save address.");
      // We don't close form on error, so they can fix it
      throw err; // Re-throw so AddressForm doesn't clear loading state incorrectly if it depended on it (though AddressForm awaits this)
    }
  };

  const handleDelete = async (id: string) => {
    setProcessingId(id);
    try {
      await deleteAddress(id);
    } catch (err: unknown) {
      const apiError = err as Error;
      alert(apiError.message || "Failed to delete address.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setProcessingId(id);
    try {
      await setDefaultShipping(id);
    } catch (err: unknown) {
      const apiError = err as Error;
      alert(apiError.message || "Failed to set default address.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl hidden md:block">Addresses</h2>
          <p className="text-muted-foreground mt-1">Manage your shipping and billing addresses.</p>
        </div>
        
        {!isFormOpen && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-sm text-sm">
          {error.message || "Failed to load addresses. Please try again."}
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-card border rounded-sm p-6 max-w-3xl">
          <h3 className="text-lg font-medium mb-6">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h3>
          
          {formError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-sm mb-6 text-sm">
              {formError}
            </div>
          )}
          
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <>
          {isLoading && addresses.length === 0 ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center border rounded-sm bg-muted/5">
              <MapPinOff className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl mb-2">No addresses found</h2>
              <p className="text-muted-foreground mb-6">You haven't saved any addresses yet.</p>
              <Button onClick={handleOpenCreate}>Add New Address</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
