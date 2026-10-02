"use client";

import { useState } from "react";
import { AdminProduct } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Star, AlertCircle, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageUpload } from "@/components/admin/ui/ImageUpload";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";

export function ProductMediaManager({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const images = product.images || [];
  const maxImages = 10;
  const canUpload = images.length < maxImages;

  const handleDeleteClick = (imageId: string) => {
    setImageToDelete(imageId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;
    setError(null);
    setIsDeleting(true);
    try {
      await adminApi.deleteImage(product.id, imageToDelete);
      setIsDeleteDialogOpen(false);
      setImageToDelete(null);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to delete image");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setError(null);
    try {
      await adminApi.setPrimaryImage(product.id, imageId);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to set primary image");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === images.length - 1) return;

    const newOrder = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap
    const temp = newOrder[index];
    newOrder[index] = newOrder[swapIndex];
    newOrder[swapIndex] = temp;

    const orderedIds = newOrder.map(img => img.id);

    setError(null);
    try {
      await adminApi.reorderImages(product.id, orderedIds);
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to reorder images");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-serif">Media Gallery</h3>
          <p className="text-sm text-muted-foreground">{images.length} of {maxImages} images used</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Zone */}
      {canUpload && (
        <div className="bg-card border rounded-sm p-4 sm:p-6 mb-6">
          <ImageUpload
            purpose="product"
            productId={product.id}
            onSuccess={() => {
              setError(null);
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="p-12 text-center border rounded-sm text-muted-foreground bg-muted/10">
          <ImageIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground">No product images yet</p>
          <p className="text-sm">Upload high-quality product images to build the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`flex flex-col bg-card border rounded-sm overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 ${img.isPrimary ? 'ring-2 ring-primary border-primary/50' : 'hover:border-border/80'}`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square bg-muted border-b flex items-center justify-center overflow-hidden">
                <Image
                  src={img.secureUrl}
                  alt={img.altText || `Product image ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    PRIMARY
                  </div>
                )}
              </div>

              {/* Accessible Action Bar (Always Visible) */}
              <div className="p-3 bg-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  {/* Reorder Controls */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-sm"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      aria-label={`Move image ${idx + 1} left`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-sm"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === images.length - 1}
                      aria-label={`Move image ${idx + 1} right`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Delete Control */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-sm text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30 hover:border-destructive"
                    onClick={() => handleDeleteClick(img.id)}
                    aria-label={`Delete image ${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Primary Control */}
                {!img.isPrimary && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs font-medium"
                    onClick={() => handleSetPrimary(img.id)}
                  >
                    Set as Primary
                  </Button>
                )}
                {img.isPrimary && (
                  <div className="h-8 w-full flex items-center justify-center text-xs font-medium text-primary bg-primary/10 rounded-sm">
                    Primary Image
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Image"
        description="Are you sure you want to delete this image? It will be removed from the gallery permanently."
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
