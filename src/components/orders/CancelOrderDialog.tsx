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
import { AlertCircle, Ban } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

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
  const { toast } = useToast();

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
      toast({
        title: "Order Cancelled",
        description: "Your cancellation request has been processed successfully.",
        variant: "default",
      });
      handleClose();
      router.refresh(); // Refresh authoritative order state
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel order. Please try again.";
      setError(message);
      toast({
        title: "Cancellation Failed",
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
        className="text-xs uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
      >
        <Ban className="w-3.5 h-3.5 mr-1.5" />
        Cancel Order
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone once confirmed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-sm flex items-start gap-2 border border-destructive/20">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-xs uppercase tracking-wider text-muted-foreground">
                Reason (Optional)
              </Label>
              <Select
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm"
              >
                <option value="">Select a reason</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Expected delivery time is too long">Expected delivery time is too long</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancel-note" className="text-xs uppercase tracking-wider text-muted-foreground">
                Additional Note (Optional)
              </Label>
              <Textarea
                id="cancel-note"
                placeholder="Provide any additional details for our concierge team..."
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
                Keep Order
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                className="text-xs uppercase tracking-wider gap-2"
              >
                {isSubmitting && <Spinner size="sm" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
