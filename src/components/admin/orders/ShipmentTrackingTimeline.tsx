import React from 'react';
import type { AdminShipmentTrackingEvent } from '@/types/admin';
import { CheckCircle, Circle, ArrowDown, MapPin } from 'lucide-react';

export function ShipmentTrackingTimeline({ events }: { events: AdminShipmentTrackingEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Tracking Events</h4>
        <p className="text-sm text-gray-500 italic">No tracking events available yet.</p>
      </div>
    );
  }

  // Sort events so latest is at the top or bottom depending on preference. Let's do chronological (oldest to newest)
  const sortedEvents = [...events].sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Tracking Timeline</h4>
      <div className="relative border-l border-gray-200 ml-3 space-y-6">
        {sortedEvents.map((event, index) => {
          const isLast = index === sortedEvents.length - 1;
          const isDelivered = event.status === 'DELIVERED';

          return (
            <div key={event.id} className="relative pl-6">
              {isDelivered ? (
                <CheckCircle className="absolute -left-3 top-0 w-6 h-6 text-green-500 bg-white" />
              ) : isLast ? (
                <ArrowDown className="absolute -left-3 top-0 w-6 h-6 text-indigo-500 bg-white border border-indigo-200 rounded-full p-1" />
              ) : (
                <Circle className="absolute -left-1.5 top-1.5 w-3 h-3 text-gray-400 bg-white fill-current" />
              )}
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                <div>
                  <p className={`text-sm font-medium ${isLast ? 'text-gray-900' : 'text-gray-700'}`}>
                    {event.status.replace(/_/g, ' ')}
                  </p>
                  {event.message && (
                    <p className="text-sm text-gray-600 mt-0.5">{event.message}</p>
                  )}
                  {event.location && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {event.location}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(event.eventTime).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
