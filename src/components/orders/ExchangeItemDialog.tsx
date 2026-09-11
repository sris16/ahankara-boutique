"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/order";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";
import { OrderItem } from "@/types/order";

interface ExchangeItemDialogProps {
  orderId: string;
  item: OrderItem;
  eligibleQuantity: number;
}

export function ExchangeItemDialog({ orderId, item, eligibleQuantity }: ExchangeItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [replacementVariantId, setReplacementVariantId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const router = useRouter();

  if (eligibleQuantity <= 0) return null;

  const fetchVariants = async () => {
    setIsLoadingVariants(true);
    try {
      const res = await apiClient.get<{ data: any }>(`/api/products/${item.productSlug}`);
      if (res.data && res.data.variants) {
        // Filter out the exact same variant they ordered
        const availableVariants = res.data.variants.filter((v: any) => v.id !== item.variantId && v.isActive);
        setVariants(availableVariants);
      }
    } catch (err) {
      console.error("Failed to load variants", err);
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleOpen = () => {
    setQuantity(1);
    setReason("");
    setReplacementVariantId("");
    setError("");
    setIsOpen(true);
    fetchVariants();
  };

  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!replacementVariantId) {
      setError("Please select a replacement item.");
      setIsSubmitting(false);
      return;
    }

    try {
      await orderApi.createExchange(orderId, {
        items: [{ orderItemId: item.id, quantity, replacementVariantId }],
        reason,
      });
      handleClose();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to submit exchange request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Exchange
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-sm border shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-serif text-xl">Exchange Item</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-5">

              <div className="bg-muted/10 p-3 rounded-sm border text-sm">
                <p className="font-medium text-xs text-muted-foreground uppercase mb-1">Returning</p>
                <p className="font-medium">{item.productName}</p>
                <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                  {item.color && <span>{item.color}</span>}
                  {item.color && item.size && <span>|</span>}
                  {item.size && <span>{item.size}</span>}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {eligibleQuantity > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity to Exchange</label>
                  <select
                    className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {Array.from({ length: eligibleQuantity }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Replacement Size / Color</label>
                {isLoadingVariants ? (
                  <div className="p-3 border rounded-sm flex items-center justify-center text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading available variants...
                  </div>
                ) : variants.length === 0 ? (
                  <div className="p-3 border rounded-sm bg-destructive/10 text-destructive text-sm">
                    No other variants available for exchange.
                  </div>
                ) : (
                  <select
                    className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground"
                    value={replacementVariantId}
                    onChange={(e) => setReplacementVariantId(e.target.value)}
                    required
                  >
                    <option value="">Select a replacement</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.size || 'Default Size'} {v.color ? ` - ${v.color}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Exchange (Optional)</label>
                <textarea
                  className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground min-h-[80px]"
                  placeholder="Tell us why you are exchanging..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || variants.length === 0}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Exchange Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
