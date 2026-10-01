"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/order";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { OrderItem } from "@/types/order";
import { ProductVariantDetail } from "@/types/catalog";

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
  const [variants, setVariants] = useState<ProductVariantDetail[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  if (eligibleQuantity <= 0) return null;

  const fetchVariants = async () => {
    setIsLoadingVariants(true);
    try {
      const res = await apiClient.get<{ data: { variants?: ProductVariantDetail[] } }>(`/api/products/${item.productSlug}`);
      if (res.data && res.data.variants) {
        // Filter out the exact same variant they ordered, keep available active variants
        const availableVariants = res.data.variants.filter((v: ProductVariantDetail) => v.id !== item.variantId && v.available);
        setVariants(availableVariants);
      }
    } catch (err: unknown) {
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
      toast({
        title: "Exchange Request Submitted",
        description: `Your exchange request for ${item.productName} has been submitted.`,
        variant: "default",
      });
      handleClose();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit exchange request. Please try again.";
      setError(message);
      toast({
        title: "Exchange Request Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="text-xs uppercase tracking-wider gap-1.5"
      >
        <RefreshCw className="w-3 h-3 text-muted-foreground" />
        Exchange
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exchange Item</DialogTitle>
            <DialogDescription>
              Select an alternate size or color for your piece.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Returning item summary */}
            <div className="bg-surface/80 p-3 rounded-sm border border-border/60 text-xs">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Returning Item</p>
              <p className="font-medium text-foreground">{item.productName}</p>
              <div className="text-muted-foreground mt-0.5 flex gap-2">
                {item.color && <span>Color: {item.color}</span>}
                {item.color && item.size && <span>•</span>}
                {item.size && <span>Size: {item.size}</span>}
                <span>•</span>
                <span>Eligible: {eligibleQuantity}</span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-sm flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {eligibleQuantity > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="exchange-quantity" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Quantity to Exchange
                </Label>
                <Select
                  id="exchange-quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="text-sm"
                >
                  {Array.from({ length: eligibleQuantity }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="replacement-variant" className="text-xs uppercase tracking-wider text-muted-foreground">
                Replacement Size / Color
              </Label>
              {isLoadingVariants ? (
                <div className="p-3 border border-border/60 rounded-sm flex items-center justify-center text-muted-foreground text-xs gap-2">
                  <Spinner size="sm" />
                  Loading available variants...
                </div>
              ) : variants.length === 0 ? (
                <div className="p-3 border border-border/60 rounded-sm bg-muted/20 text-muted-foreground text-xs">
                  No other active variants are currently in stock for exchange.
                </div>
              ) : (
                <Select
                  id="replacement-variant"
                  value={replacementVariantId}
                  onChange={(e) => setReplacementVariantId(e.target.value)}
                  className="text-sm"
                  required
                >
                  <option value="">Select a replacement</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size || 'Default Size'} {v.color ? `— ${v.color}` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exchange-reason" className="text-xs uppercase tracking-wider text-muted-foreground">
                Reason for Exchange (Optional)
              </Label>
              <Textarea
                id="exchange-reason"
                placeholder="Let us know what prompted the exchange (e.g., fit, styling)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-xs uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || variants.length === 0}
                className="text-xs uppercase tracking-wider gap-2"
              >
                {isSubmitting && <Spinner size="sm" />}
                Submit Exchange
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
