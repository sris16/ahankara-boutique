import { OrderTrackingResponse } from "@/types/order";
import { formatDate } from "@/lib/utils";
import { CopyButton, RefreshButton } from "./ClientActions";
import { Package, Truck, CheckCircle2, AlertCircle } from "lucide-react";

export function TrackingModule({ trackingData }: { trackingData: OrderTrackingResponse }) {
  // If no shipments exist yet (the backend hasn't allocated any)
  if (!trackingData.shipments || trackingData.shipments.length === 0) {
    return (
      <div className="bg-card border rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            Shipment Status
          </h3>
          <RefreshButton />
        </div>
        <div className="bg-muted/30 border border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center">
          <Truck className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="font-medium text-sm mb-1">Tracking not available yet</p>
          <p className="text-xs text-muted-foreground">
            We are preparing your order. Tracking information will appear here once your package ships.
          </p>
        </div>
      </div>
    );
  }

  // Render shipments (usually just one, but backend array supports multiple)
  return (
    <div className="space-y-6">
      {trackingData.shipments.map((shipment, idx) => (
        <div key={shipment.id} className="bg-card border rounded-sm p-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 md:p-6 border-b bg-muted/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="font-serif text-lg flex items-center gap-2 mb-1">
                <Truck className="w-5 h-5 text-muted-foreground" />
                Shipment {trackingData.shipments.length > 1 ? idx + 1 : ""}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium tracking-wide uppercase text-xs px-2 py-0.5 bg-foreground/10 rounded-sm">
                  {shipment.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
              {shipment.trackingNumber ? (
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground mr-2">AWB:</span>
                    <span className="font-mono font-medium">{shipment.trackingNumber}</span>
                  </div>
                  <CopyButton text={shipment.trackingNumber} label="Copy AWB" />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">AWB Allocation Pending</div>
              )}
              {shipment.courierName && (
                <div className="text-xs text-muted-foreground">
                  Courier: <span className="font-medium text-foreground">{shipment.courierName}</span>
                </div>
              )}
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline underline-offset-2 hover:text-foreground text-muted-foreground mt-1"
                >
                  Track on Provider Site
                </a>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-4 md:p-6 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Tracking Timeline</h4>
              <RefreshButton />
            </div>

            {(!shipment.trackingHistory || shipment.trackingHistory.length === 0) ? (
              <p className="text-sm text-muted-foreground italic px-2">No tracking events recorded yet.</p>
            ) : (
              <div className="relative border-l border-muted ml-3 space-y-6 pb-2">
                {shipment.trackingHistory.map((event, i) => {
                  const isLatest = i === 0;
                  const isDelivered = event.status === "DELIVERED";
                  const isError = event.status === "DELIVERY_FAILED" || event.status === "CANCELLED";

                  let Icon = Package;
                  let iconColor = "text-muted-foreground";
                  const bgColor = "bg-background";

                  if (isLatest) {
                    if (isDelivered) {
                      Icon = CheckCircle2;
                      iconColor = "text-green-600 dark:text-green-400";
                    } else if (isError) {
                      Icon = AlertCircle;
                      iconColor = "text-destructive";
                    } else {
                      Icon = Truck;
                      iconColor = "text-blue-600 dark:text-blue-400";
                    }
                  }

                  return (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute -left-[11px] top-1 rounded-full border ${isLatest ? 'border-foreground border-2' : 'border-muted'} ${bgColor} p-0.5`}>
                        <Icon className={`w-3 h-3 ${iconColor}`} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm ${isLatest ? "font-medium" : "text-muted-foreground"}`}>
                          {event.message || event.status.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(event.eventTime)}</span>
                          {event.location && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
