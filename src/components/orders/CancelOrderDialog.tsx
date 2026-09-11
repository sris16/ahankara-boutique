"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/order";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";

interface CancelOrderDialogProps {
  orderId: string;
}

export function CancelOrderDialog({ orderId }: CancelOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setReason("");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await orderApi.cancelOrder(orderId, { reason, note });
      handleClose();
      router.refresh(); // Refresh authoritative order state
    } catch (err: any) {
      setError(err?.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        Cancel Order
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-sm border shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-serif text-xl">Cancel Order</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to cancel this order? This action cannot be undone.
              </p>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (Optional)</label>
                <select
                  className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Expected delivery time is too long">Expected delivery time is too long</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Note (Optional)</label>
                <textarea
                  className="w-full p-2 text-sm border rounded-sm bg-background focus:outline-none focus:border-foreground min-h-[80px]"
                  placeholder="Provide more details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Keep Order
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
