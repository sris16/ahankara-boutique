"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";

interface DeleteAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  isDeleting: boolean;
  addressLabel?: string;
}

export function DeleteAddressDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  addressLabel,
}: DeleteAddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border border-border/80 rounded-xs p-6 shadow-md">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="font-serif text-xl tracking-tight text-foreground">
            Delete Saved Address
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove {addressLabel ? <span className="font-medium text-foreground">&ldquo;{addressLabel}&rdquo;</span> : "this address"} from your saved delivery destinations? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xs text-xs uppercase tracking-widest h-10 font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto rounded-xs text-xs uppercase tracking-widest h-10 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Removing...
              </>
            ) : (
              "Delete Address"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
