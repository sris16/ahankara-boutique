"use client";

import { useState, useRef } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  name?: string;
  purpose: "category" | "collection" | "product";
  productId?: string;
  defaultValue?: string | null;
  onChange?: (url: string | null) => void;
  onSuccess?: () => void;
}

export function ImageUpload({ name = "imageUrl", purpose, productId, defaultValue, onChange, onSuccess }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValue || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doUpload = async (formData: FormData) => {
    try {
      if (purpose === "product") {
        if (!productId) throw new Error("Product ID is required for product images");
        await apiClient.post(`/api/admin/products/${productId}/images`, formData);
        // For products, we don't set a single imageUrl since it's a grid, we just trigger success
        onSuccess?.();
      } else {
        const response = await apiClient.post<{ url: string; publicId: string }>("/api/admin/media/upload", formData);
        setImageUrl(response.url);
        onChange?.(response.url);
        onSuccess?.();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to upload image");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  }

  const handleRemove = () => {
    setImageUrl(null);
    onChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to seamlessly integrate with native FormData in parent forms */}
      <input type="hidden" name={name} value={imageUrl || ""} />

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-sm">
          {error}
        </div>
      )}

      {imageUrl ? (
        <div className="relative border rounded-sm overflow-hidden group bg-muted aspect-video max-w-sm flex items-center justify-center">
          <Image
            src={imageUrl}
            alt="Uploaded preview"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 384px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isUploading}
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (!isUploading && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={isUploading ? -1 : 0}
          role="button"
          aria-label={`Upload ${purpose} image`}
          aria-disabled={isUploading}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors max-w-sm flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isUploading
              ? "bg-muted cursor-not-allowed border-muted-foreground/20"
              : "hover:bg-muted/50 border-muted-foreground/20 hover:border-foreground/40"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-muted-foreground">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">Click to upload image</p>
              <p className="text-xs opacity-70 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB limit");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          const allowed = ['image/jpeg', 'image/png', 'image/webp'];
          if (!allowed.includes(file.type)) {
            setError("Invalid file format. Only JPEG, PNG, and WebP are allowed.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          setIsUploading(true);
          setError(null);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("purpose", purpose);
          doUpload(formData);
        }}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
