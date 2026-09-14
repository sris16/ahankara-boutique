"use client";

import { useState } from "react";
import { AdminProduct, AdminVariant } from "@/types/admin";
import { VariantForm } from "./VariantForm";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Box, AlertCircle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";

export function VariantManager({ product }: { product: AdminProduct }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<AdminVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingVariant(null);
    setIsFormOpen(true);
  };

  const handleEdit = (variant: AdminVariant) => {
    setEditingVariant(variant);
    setIsFormOpen(true);
  };

  const handleDelete = async (variant: AdminVariant) => {
    if (!window.confirm(`Are you sure you want to delete variant ${variant.sku}?`)) return;
    setError(null);
    try {
      await adminApi.deleteVariant(product.id, variant.id);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Failed to delete variant");
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
        <div className="p-8 text-center border rounded-sm text-muted-foreground bg-muted/10">
          <Box className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No variants configured for this product.</p>
        </div>
      ) : (
        <div className="border rounded-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Size / Color</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((v) => (
                <tr key={v.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{v.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.size || '—'} / {v.color || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.price !== null ? `₹${(v.price / 100).toFixed(2)}` : 'Uses base'}
                  </td>
                  <td className="px-4 py-3">
                    {v.isActive ? (
                      <span className="text-green-600 font-medium text-xs">Active</span>
                    ) : (
                      <span className="text-destructive font-medium text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(v)} aria-label={`Edit ${v.sku}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(v)} className="text-destructive hover:bg-destructive/10" aria-label={`Delete ${v.sku}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
