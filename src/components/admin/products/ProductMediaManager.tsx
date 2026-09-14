/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { AdminProduct } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Trash2, Star, Upload, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductMediaManager({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const images = product.images || [];
  const maxImages = 10;
  const canUpload = images.length < maxImages;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate frontend constraints
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit.");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    setIsUploading(true);
    try {
      await adminApi.uploadImage(product.id, file);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    setError(null);
    try {
      await adminApi.deleteImage(product.id, imageId);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Failed to delete image");
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setError(null);
    try {
      await adminApi.setPrimaryImage(product.id, imageId);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Failed to set primary image");
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
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Failed to reorder images");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-serif">Media</h3>
          <p className="text-sm text-muted-foreground">{images.length}/{maxImages} images</p>
        </div>
        <div>
          <input 
            type="file" 
            id="image-upload" 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={!canUpload || isUploading}
          />
          <Button asChild disabled={!canUpload || isUploading} size="sm">
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Image"}
            </label>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="p-8 text-center border rounded-sm text-muted-foreground bg-muted/10 border-dashed">
          <p>No images uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div key={img.id} className={`group relative aspect-[3/4] bg-muted border rounded-sm overflow-hidden ${img.isPrimary ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
              <img src={img.secureUrl} alt={img.altText || 'Product image'} className="w-full h-full object-cover" />
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-between items-start">
                  <div className="flex gap-1">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-7 w-7 rounded-sm opacity-90 hover:opacity-100" 
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-7 w-7 rounded-sm opacity-90 hover:opacity-100"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === images.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 rounded-sm opacity-90 hover:opacity-100 text-destructive border-destructive"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {!img.isPrimary && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full opacity-90 hover:opacity-100 h-8 text-xs"
                    onClick={() => handleSetPrimary(img.id)}
                  >
                    Set Primary
                  </Button>
                )}
              </div>

              {img.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground p-1 rounded-sm shadow-sm group-hover:opacity-0 transition-opacity">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
