"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/order";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";
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
      handleClose();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to submit return request. Please try again.");
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
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Return
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-sm border shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-serif text-xl">Return Item</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-5">

              <div className="bg-muted/10 p-3 rounded-sm border text-sm">
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
                  <label className="text-sm font-medium">Quantity to Return</label>
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
                <label className="text-sm font-medium">Reason for Return</label>
                <select
                  className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReturnReason)}
                  required
                >
                  {Object.entries(reasonLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Details (Optional)</label>
                <textarea
                  className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground min-h-[80px]"
                  placeholder="Tell us more about the issue..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Return Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
