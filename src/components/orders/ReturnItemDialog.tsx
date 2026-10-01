"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/order";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ReturnReason, OrderItem } from "@/types/order";

interface ReturnItemDialogProps {
  orderId: string;
  item: OrderItem;
  eligibleQuantity: number;
}

export function ReturnItemDialog({ orderId, item, eligibleQuantity }: ReturnItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<ReturnReason>("DEFECTIVE");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  if (eligibleQuantity <= 0) return null;

  const handleOpen = () => {
    setQuantity(1);
    setReason("DEFECTIVE");
    setNote("");
    setError("");
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await orderApi.createReturn(orderId, {
        items: [{ orderItemId: item.id, quantity, reason }],
        customerNote: note,
      });
      toast({
        title: "Return Request Submitted",
        description: `Your return request for ${item.productName} has been submitted.`,
        variant: "default",
      });
      handleClose();
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit return request. Please try again.";
      setError(message);
      toast({
        title: "Return Request Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonLabels: Record<ReturnReason, string> = {
    DEFECTIVE: "Item is defective / damaged",
    WRONG_ITEM: "Received the wrong item",
    SIZE_ISSUE: "Size does not fit",
    NOT_AS_DESCRIBED: "Item not as described",
    CHANGED_MIND: "Changed my mind",
    OTHER: "Other reason",
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="text-xs uppercase tracking-wider gap-1.5"
      >
        <RotateCcw className="w-3 h-3 text-muted-foreground" />
        Return
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            <DialogDescription>
              Submit a return request for eligible items within our atelier return window.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Item summary banner */}
            <div className="bg-surface/80 p-3 rounded-sm border border-border/60 text-xs">
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
                <Label htmlFor="return-quantity" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Quantity to Return
                </Label>
                <Select
                  id="return-quantity"
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
              <Label htmlFor="return-reason" className="text-xs uppercase tracking-wider text-muted-foreground">
                Reason for Return
              </Label>
              <Select
                id="return-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="text-sm"
                required
              >
                {Object.entries(reasonLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="return-note" className="text-xs uppercase tracking-wider text-muted-foreground">
                Additional Details (Optional)
              </Label>
              <Textarea
                id="return-note"
                placeholder="Tell our concierge team more about the condition or issue..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                disabled={isSubmitting}
                className="text-xs uppercase tracking-wider gap-2"
              >
                {isSubmitting && <Spinner size="sm" />}
                Submit Return
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
