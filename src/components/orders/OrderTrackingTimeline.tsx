"use client";

import { useMemo } from "react";
import { OrderStatus, FulfillmentStatus, ShipmentStatus, TrackingEvent } from "@/types/order";
import { formatDate } from "@/lib/utils";
import { Check, Clock, Package, Truck, Home, AlertCircle, RotateCcw } from "lucide-react";

interface OrderTrackingTimelineProps {
  orderStatus: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  shipmentStatus?: ShipmentStatus | null;
  createdAt: string | Date;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  estimatedDeliveryAt?: string | Date | null;
  trackingEvents?: TrackingEvent[];
}

interface Step {
  id: string;
  title: string;
  subtitle?: string;
  date?: string | null;
  icon: React.ComponentType<{ className?: string }>;
  status: "complete" | "current" | "upcoming";
}

export function OrderTrackingTimeline({
  orderStatus,
  fulfillmentStatus,
  shipmentStatus,
  createdAt,
  shippedAt,
  deliveredAt,
  estimatedDeliveryAt,
  trackingEvents = [],
}: OrderTrackingTimelineProps) {
  const isCancelled = orderStatus === "CANCELLED" || fulfillmentStatus === "CANCELLED";
  const isRTO = fulfillmentStatus === "RTO" || shipmentStatus?.startsWith("RTO");

  // Determine stage progression (0 to 4)
  const currentStageIndex = useMemo(() => {
    if (isCancelled || isRTO) return -1;
    if (fulfillmentStatus === "DELIVERED" || shipmentStatus === "DELIVERED" || orderStatus === "DELIVERED") return 4;
    if (shipmentStatus === "OUT_FOR_DELIVERY") return 3;
    if (fulfillmentStatus === "FULFILLED" || fulfillmentStatus === "PARTIALLY_FULFILLED" || shipmentStatus === "IN_TRANSIT" || shipmentStatus === "PICKED_UP" || orderStatus === "SHIPPED") return 2;
    if (orderStatus === "CONFIRMED" || orderStatus === "PROCESSING" || fulfillmentStatus === "PROCESSING" || shipmentStatus === "READY_TO_SHIP" || shipmentStatus === "SHIPMENT_CREATED") return 1;
    return 0; // PENDING_PAYMENT or freshly placed
  }, [orderStatus, fulfillmentStatus, shipmentStatus, isCancelled, isRTO]);

  const steps: Step[] = useMemo(() => {
    const formattedCreated = formatDate(createdAt);
    const formattedShipped = shippedAt ? formatDate(shippedAt) : null;
    const formattedDelivered = deliveredAt ? formatDate(deliveredAt) : null;

    return [
      {
        id: "placed",
        title: "Order Placed",
        subtitle: "Verified & confirmed",
        date: formattedCreated,
        icon: Clock,
        status: currentStageIndex >= 0 ? (currentStageIndex === 0 ? "current" : "complete") : "complete",
      },
      {
        id: "processing",
        title: "Atelier Preparation",
        subtitle: "Garment inspection & packaging",
        date: currentStageIndex >= 1 ? (formattedShipped ? null : "In progress") : null,
        icon: Package,
        status: currentStageIndex > 1 ? "complete" : currentStageIndex === 1 ? "current" : "upcoming",
      },
      {
        id: "shipped",
        title: "Dispatched",
        subtitle: "Courier transit underway",
        date: formattedShipped,
        icon: Truck,
        status: currentStageIndex > 2 ? "complete" : currentStageIndex === 2 ? "current" : "upcoming",
      },
      {
        id: "out_for_delivery",
        title: "Out for Delivery",
        subtitle: "Arriving with delivery agent",
        date: currentStageIndex >= 3 && !formattedDelivered ? "Today" : null,
        icon: Truck,
        status: currentStageIndex > 3 ? "complete" : currentStageIndex === 3 ? "current" : "upcoming",
      },
      {
        id: "delivered",
        title: "Delivered",
        subtitle: estimatedDeliveryAt && !deliveredAt ? `Est: ${formatDate(estimatedDeliveryAt)}` : "Client receipt confirmed",
        date: formattedDelivered,
        icon: Home,
        status: currentStageIndex === 4 ? "complete" : "upcoming",
      },
    ];
  }, [createdAt, shippedAt, deliveredAt, estimatedDeliveryAt, currentStageIndex]);

  if (isCancelled) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xs p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif text-base text-foreground font-medium">Order Cancelled</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This acquisition was cancelled. Any applicable payments have been queued for processing through your original payment method.
          </p>
        </div>
      </div>
    );
  }

  if (isRTO) {
    return (
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xs p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-serif text-base text-foreground font-medium">Return to Atelier (RTO)</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The package could not be completed at your destination address and is returning to AHANKARA STUDIOS Atelier. Our concierge will contact you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border/80 rounded-xs p-6 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg tracking-tight text-foreground">Delivery Journey</h3>
          <p className="text-xs text-muted-foreground font-mono">Real-time fulfillment & tracking progression</p>
        </div>
        {estimatedDeliveryAt && !deliveredAt && (
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
              Estimated Delivery
            </span>
            <span className="text-xs font-semibold text-foreground font-mono">
              {formatDate(estimatedDeliveryAt)}
            </span>
          </div>
        )}
      </div>

      {/* Desktop Horizontal Stepper (md:flex) */}
      <div className="hidden md:block py-4">
        <ol className="grid grid-cols-5 relative" aria-label="Order Tracking Timeline">
          {/* Background Connecting Rail */}
          <div
            className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-border/80 -z-0"
            aria-hidden="true"
          >
            {/* Active Highlight Rail */}
            <div
              className="h-full bg-foreground transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, (currentStageIndex / 4) * 100))}%`,
              }}
            />
          </div>

          {steps.map((step) => {
            const isCompleted = step.status === "complete";
            const isCurrent = step.status === "current";
            const Icon = step.icon;

            return (
              <li
                key={step.id}
                className="flex flex-col items-center text-center relative z-10 px-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Milestone Node */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-foreground text-background shadow-xs ring-4 ring-background"
                      : isCurrent
                      ? "bg-background text-foreground border-2 border-foreground ring-4 ring-primary/10 shadow-xs"
                      : "bg-surface-muted/80 text-muted-foreground/60 border border-border/80"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Metadata */}
                <span className={`text-xs font-medium uppercase tracking-wider mt-3 ${isCurrent ? "text-foreground font-semibold" : isCompleted ? "text-foreground/90" : "text-muted-foreground/70"}`}>
                  {step.title}
                </span>

                {step.date && (
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {step.date}
                  </span>
                )}

                {step.subtitle && !step.date && (
                  <span className="text-[10px] text-muted-foreground/70 line-clamp-1 mt-0.5">
                    {step.subtitle}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile Vertical Stepper (block md:hidden) */}
      <div className="block md:hidden py-2">
        <ol className="relative border-l-2 border-border/80 ml-4 space-y-6" aria-label="Order Tracking Timeline">
          {steps.map((step) => {
            const isCompleted = step.status === "complete";
            const isCurrent = step.status === "current";
            const Icon = step.icon;

            return (
              <li
                key={step.id}
                className="relative pl-6"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Node on vertical line */}
                <div
                  className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCompleted
                      ? "bg-foreground text-background shadow-xs"
                      : isCurrent
                      ? "bg-background text-foreground border-2 border-foreground ring-2 ring-primary/10 shadow-xs"
                      : "bg-surface-muted text-muted-foreground/60 border border-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-medium uppercase tracking-wider ${isCurrent ? "text-foreground font-semibold" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                    {step.date && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {step.date}
                      </span>
                    )}
                  </div>
                  {step.subtitle && (
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Real-time Tracking Events Log (if available from carrier) */}
      {trackingEvents.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border/60">
          <h4 className="text-[11px] uppercase font-mono tracking-[0.2em] text-muted-foreground mb-3">
            Carrier Checkpoints
          </h4>
          <div className="space-y-2.5">
            {trackingEvents.slice(0, 4).map((evt, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs gap-4 font-mono">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-foreground">{evt.message}</p>
                    {evt.location && (
                      <p className="text-[10px] text-muted-foreground/80">{evt.location}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDate(evt.eventTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
