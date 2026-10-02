"use client";

import { useState } from "react";
import { AdminProduct, AdminVariant } from "@/types/admin";
import { VariantForm } from "./VariantForm";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Edit2, Trash2, Box, AlertCircle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";

export function VariantManager({ product }: { product: AdminProduct }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<AdminVariant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingVariant(null);
    setIsFormOpen(true);
  };

  const handleEdit = (variant: AdminVariant) => {
    setEditingVariant(variant);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (variant: AdminVariant) => {
    setVariantToDelete(variant);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!variantToDelete) return;
    setError(null);
    setIsDeleting(true);
    try {
      await adminApi.deleteVariant(product.id, variantToDelete.id);
      setIsDeleteDialogOpen(false);
      setVariantToDelete(null);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Failed to delete variant");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const variants = product.variants || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-serif">Variants</h3>
          <p className="text-sm text-muted-foreground">Manage SKUs, sizes, colors, and specific pricing</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {variants.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No Variants Found"
          description="No variants configured for this product."
          action={{
            label: "Add Variant",
            onClick: handleCreate
          }}
        />
      ) : (
        <div className="space-y-3">
          {/* Desktop Header */}
          <div className="hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 text-xs text-muted-foreground uppercase bg-muted/50 border rounded-t-sm font-medium">
            <div>SKU</div>
            <div>Size / Color</div>
            <div>Price</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Variant List */}
          <div className="flex flex-col gap-3 md:gap-0 md:border md:-mt-3 md:rounded-b-sm md:divide-y">
            {variants.map((v) => (
              <div key={v.id} className="flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 p-4 md:py-3 md:px-4 bg-card border rounded-sm md:border-0 md:rounded-none items-start md:items-center hover:bg-muted/5 transition-colors">

                {/* Mobile: SKU and Status Row */}
                <div className="flex justify-between items-start w-full md:w-auto md:block">
                  <div className="font-medium text-sm break-all">{v.sku}</div>
                  <div className="md:hidden shrink-0 ml-4">
                    <Badge variant={v.isActive ? "success" : "secondary"}>
                      {v.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="md:hidden font-medium text-xs uppercase mr-2">Attributes:</span>
                  {v.size || '—'} / {v.color || '—'}
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="md:hidden font-medium text-xs uppercase mr-2">Price:</span>
                  {v.price !== null ? `₹${(v.price / 100).toFixed(2)}` : 'Uses base'}
                </div>

                <div className="hidden md:block">
                  <Badge variant={v.isActive ? "success" : "secondary"}>
                    {v.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-border/50 md:justify-end">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(v)} aria-label={`Edit ${v.sku}`}>
                    <Edit2 className="w-4 h-4 md:mr-0 mr-2" />
                    <span className="md:hidden">Edit</span>
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(v)} aria-label={`Delete ${v.sku}`}>
                    <Trash2 className="w-4 h-4 md:mr-0 mr-2" />
                    <span className="md:hidden">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFormOpen && (
        <VariantForm
          productId={product.id}
          variant={editingVariant}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Variant"
        description={`Are you sure you want to delete variant ${variantToDelete?.sku}?`}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
