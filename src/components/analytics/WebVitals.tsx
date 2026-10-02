"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Only track in production to prevent local console spam
    if (process.env.NODE_ENV === "production") {
      trackEvent({
        name: metric.name,
        category: "performance",
        properties: {
          value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
          label: metric.label,
          id: metric.id,
        },
      });
    }
  });

  return null;
}
