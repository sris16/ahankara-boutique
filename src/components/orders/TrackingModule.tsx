import { OrderTrackingResponse, OrderStatus, ShipmentStatus } from "@/types/order";
import { CopyButton, RefreshButton } from "./ClientActions";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, ExternalLink } from "lucide-react";

export interface TrackingModuleProps {
  trackingData: OrderTrackingResponse;
  orderStatus?: OrderStatus;
  orderCreatedAt?: string | Date;
}

export function TrackingModule({ trackingData, orderStatus, orderCreatedAt }: TrackingModuleProps) {
  // If no shipments exist yet (the backend hasn't allocated any)
  if (!trackingData.shipments || trackingData.shipments.length === 0) {
    return (
      <div className="bg-background border border-border/50 rounded-none p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <h3 className="font-serif text-xl tracking-tight flex items-center gap-2.5">
            <Package className="w-5 h-5 text-muted-foreground" />
            Shipment & Tracking
          </h3>
          <RefreshButton />
        </div>

        {/* Fallback timeline showing order placement / processing */}
        <OrderTrackingTimeline
          orderStatus={orderStatus || "PROCESSING"}
          fulfillmentStatus={trackingData.fulfillmentStatus || "UNFULFILLED"}
          shipmentStatus={"PENDING" as ShipmentStatus}
          createdAt={orderCreatedAt || new Date()}
        />

        <div className="bg-muted/15 border border-dashed border-border/60 rounded-sm p-6 text-center">
          <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2.5" />
          <p className="font-medium text-sm text-foreground mb-1">Carrier Dispatch Pending</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your pieces are currently undergoing hand-finishing and quality inspection in our atelier. Airway Bill (AWB) and live carrier checkpoints will populate immediately upon courier handoff.
          </p>
        </div>
      </div>
    );
  }

  // Render shipments
  return (
    <div className="space-y-6">
      {trackingData.shipments.map((shipment, idx) => (
        <div key={shipment.id} className="bg-background border border-border/50 rounded-none overflow-hidden space-y-6 p-6">
          {/* Header */}
          <div className="pb-5 border-b border-border/40 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-xl tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  Shipment {trackingData.shipments.length > 1 ? `#${idx + 1}` : ""}
                </h3>
                <Badge
                  variant={shipment.status === "DELIVERED" ? "success" : shipment.status.includes("CANCEL") || shipment.status.includes("FAILED") ? "destructive" : "default"}
                  size="sm"
                  className="font-mono text-[10px]"
                >
                  {shipment.status.replace(/_/g, " ")}
                </Badge>
              </div>
              {shipment.courierName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fulfilled via <span className="font-medium text-foreground">{shipment.courierName}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {shipment.trackingNumber ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">AWB: {shipment.trackingNumber}</span>
                  <CopyButton text={shipment.trackingNumber} label="Copy AWB" />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">AWB Allocation in progress</span>
              )}

              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Carrier Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <RefreshButton />
            </div>
          </div>

          {/* Shipment Items Snapshot if available */}
          {shipment.items && shipment.items.length > 0 && (
            <div className="bg-muted/10 p-3 rounded-sm border border-border/40 text-xs">
              <span className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground block mb-1">
                Packages in this consignment:
              </span>
              <div className="flex flex-wrap gap-2">
                {shipment.items.map((pkgItem, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-xs bg-surface border border-border text-foreground font-medium">
                    {pkgItem.quantity}x {pkgItem.productName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visual 5-Stage Progressive Timeline */}
          <OrderTrackingTimeline
            orderStatus={orderStatus || (shipment.status === "DELIVERED" ? "DELIVERED" : "PROCESSING")}
            fulfillmentStatus={trackingData.fulfillmentStatus}
            shipmentStatus={shipment.status}
            createdAt={orderCreatedAt || new Date()}
            shippedAt={shipment.shippedAt}
            deliveredAt={shipment.deliveredAt}
            estimatedDeliveryAt={shipment.estimatedDeliveryAt}
            trackingEvents={shipment.trackingHistory}
          />
        </div>
      ))}
    </div>
  );
}
