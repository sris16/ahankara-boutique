"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Create url safely. Exclude sensitive query params if necessary.
      const paramsString = searchParams?.toString();
      
      // Basic redaction for query params (e.g., token=...)
      const safeParams = new URLSearchParams(paramsString || "");
      if (safeParams.has("token")) safeParams.set("token", "[REDACTED]");
      if (safeParams.has("code")) safeParams.set("code", "[REDACTED]");
      
      const safeParamsString = safeParams.toString();
      const url = safeParamsString ? `${pathname}?${safeParamsString}` : pathname;
      
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
