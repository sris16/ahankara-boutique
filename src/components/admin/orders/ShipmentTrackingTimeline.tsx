'use client';

import React from 'react';
import type { AdminShipmentTrackingEvent } from '@/types/admin';
import { Package, Truck, CheckCircle2, XCircle, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type StatusConfig = {
  label: string;
  icon: React.ElementType;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
};

const TRACKING_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: 'Pending', icon: Clock, badgeVariant: 'outline' },
  SHIPMENT_CREATED: { label: 'Shipment Created', icon: Package, badgeVariant: 'outline' },
  READY_TO_SHIP: { label: 'Ready to Ship', icon: Package, badgeVariant: 'outline' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', icon: Truck, badgeVariant: 'secondary' },
  PICKED_UP: { label: 'Picked Up', icon: Truck, badgeVariant: 'secondary' },
  IN_TRANSIT: { label: 'In Transit', icon: Truck, badgeVariant: 'secondary' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck, badgeVariant: 'secondary' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, badgeVariant: 'default' },
  DELIVERY_FAILED: { label: 'Delivery Failed', icon: XCircle, badgeVariant: 'destructive' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, badgeVariant: 'destructive' },
};

const getStatusConfig = (status: string): StatusConfig => {
  return TRACKING_STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    icon: Clock,
    badgeVariant: 'outline'
  };
};

const formatDate = (dateString: Date | string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  const datePart = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  const timePart = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);

  return `${datePart} · ${timePart}`;
};

export function ShipmentTrackingTimeline({ events }: { events: AdminShipmentTrackingEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/10 rounded-md border border-dashed">
        <div className="w-10 h-10 bg-muted/30 rounded-full flex items-center justify-center mb-3">
          <Package className="w-5 h-5 text-muted-foreground opacity-70" />
        </div>
        <p className="text-sm font-semibold text-foreground">Package Tracking</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-[250px] leading-relaxed">
          Tracking updates will appear here once the shipment begins moving.
        </p>
      </div>
    );
  }

  // Preserve the chronological order expected by the timeline layout
  const sortedEvents = [...events].sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracking History</h4>

      <ol className="relative ml-2 sm:ml-4" aria-label="Shipment Tracking Timeline">
        {sortedEvents.map((event, index) => {
          const isLatest = index === sortedEvents.length - 1;
          const config = getStatusConfig(event.status);
          const Icon = config.icon;

          return (
            <li key={event.id} className="relative pl-10 pb-8 last:pb-2">
              {/* Vertical connector line to next event */}
              {!isLatest && (
                <div
                  className="absolute left-4 top-8 bottom-0 w-[2px] bg-border/60 -translate-x-1/2"
                  aria-hidden="true"
                />
              )}

              {/* Timeline Indicator */}
              <div
                className={`absolute left-4 top-0 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-surface transition-colors ${
                  isLatest
                    ? 'border-primary text-primary shadow-sm'
                    : 'border-border/60 text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Event Content */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-2.5">
                   <span className={`text-sm font-bold ${isLatest ? 'text-foreground' : 'text-foreground/70'}`}>
                     {config.label}
                   </span>
                   {isLatest && (
                     <Badge variant={config.badgeVariant} className="text-[10px] uppercase h-5 px-1.5 rounded-sm font-semibold tracking-wide">
                       Current
                     </Badge>
                   )}
                </div>

                {event.message && (
                  <p className={`text-sm leading-relaxed max-w-lg break-words ${isLatest ? 'text-muted-foreground' : 'text-muted-foreground/80'}`}>
                    {event.message}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/80 pt-1">
                  {event.location && (
                    <span className="flex items-center font-medium text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      {event.location}
                    </span>
                  )}
                  <time dateTime={event.eventTime.toString()} className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 sm:hidden" aria-hidden="true" />
                    {formatDate(event.eventTime)}
                  </time>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
