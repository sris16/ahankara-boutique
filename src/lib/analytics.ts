/**
 * Provider-agnostic analytics and event tracking architecture.
 * Ensures no sensitive customer/payment/auth data is logged.
 */

export type EventCategory = "ecommerce" | "user" | "system" | "performance";

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, string | number | boolean | null>;
}

// Ensure sensitive keys are stripped before logging
const SENSITIVE_KEYS = [
  "password", "token", "creditcard", "cvv", "phone", 
  "email", "ssn", "cardnumber", "address", "secret", "key"
];

const sanitizeProperties = (props?: Record<string, string | number | boolean | null>) => {
  if (!props) return undefined;
  const sanitized: Record<string, string | number | boolean | null> = { ...props };
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
};

export const trackEvent = (event: AnalyticsEvent) => {
  const sanitizedProps = sanitizeProperties(event.properties);
  
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[Analytics Event] ${event.category}:${event.name}`, sanitizedProps || "");
  }

  // TODO: Integrate with actual provider (e.g. Mixpanel, PostHog, GA4) in future phases
};

export const trackPageView = (url: string) => {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[Analytics PageView] ${url}`);
  }
  
  // TODO: Integrate with actual provider
};
