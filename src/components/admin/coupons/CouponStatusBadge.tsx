import { Badge } from "@/components/ui/badge";
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
      <Badge variant="secondary" className={cn("uppercase text-[10px] tracking-wider font-semibold", className)}>
        Inactive
      </Badge>
    );
  }

  const now = new Date();

  if (startsAt && new Date(startsAt) > now) {
    return (
      <Badge variant="warning" className={cn("uppercase text-[10px] tracking-wider font-semibold", className)}>
        Scheduled
      </Badge>
    );
  }

  if (endsAt && new Date(endsAt) < now) {
    return (
      <Badge variant="destructive" className={cn("uppercase text-[10px] tracking-wider font-semibold", className)}>
        Expired
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={cn("uppercase text-[10px] tracking-wider font-semibold", className)}>
      Active
    </Badge>
  );
}
