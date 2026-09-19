import { cn } from "@/lib/utils";

interface CouponStatusBadgeProps {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  className?: string;
}

export function CouponStatusBadge({ isActive, startsAt, endsAt, className }: CouponStatusBadgeProps) {
  if (!isActive) {
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800", className)}>
        Inactive
      </span>
    );
  }

  const now = new Date();

  if (startsAt && new Date(startsAt) > now) {
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800", className)}>
        Scheduled
      </span>
    );
  }

  if (endsAt && new Date(endsAt) < now) {
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", className)}>
        Expired
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", className)}>
      Active
    </span>
  );
}
