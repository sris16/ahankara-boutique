"use client";

import { useState } from "react";
import { AdminCoupon } from "@/types/admin";
import { CouponStatusBadge } from "./CouponStatusBadge";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Search, Plus, ArrowRight, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponTableProps {
  initialCoupons: AdminCoupon[];
}

export function CouponTable({ initialCoupons }: CouponTableProps) {
  const [search, setSearch] = useState("");

  const filteredCoupons = initialCoupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-card border rounded-sm p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 w-full"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild className="w-full sm:w-auto h-10">
          <Link href="/admin/coupons/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {filteredCoupons.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Ticket className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium text-foreground">No coupons found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {initialCoupons.length === 0
                ? "You haven't created any coupons yet."
                : "No coupons match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden border">
          <div className="divide-y divide-border">
            {filteredCoupons.map((coupon) => (
              <div key={coupon.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                  {/* Left Column: Context (Code/Name) */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <p className="font-semibold text-foreground truncate max-w-[250px] sm:max-w-md" title={coupon.code}>
                        {coupon.code}
                      </p>
                      <div className="md:hidden">
                        <CouponStatusBadge
                          isActive={coupon.isActive}
                          startsAt={coupon.startsAt}
                          endsAt={coupon.endsAt}
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground truncate max-w-[250px] sm:max-w-md" title={coupon.name}>
                      {coupon.name}
                    </p>
                  </div>

                  {/* Right Column: Discount, Usage, Status, Action */}
                  <div className="flex flex-row items-center justify-between md:justify-end gap-6 md:w-auto shrink-0">

                    {/* Metrics Stack */}
                    <div className="flex flex-col items-start md:items-end gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-bold text-foreground">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : formatPrice(coupon.value)
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Usage:</span>
                        <span className="font-medium">
                          {coupon._count?.redemptions || 0}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:block">
                      <CouponStatusBadge
                        isActive={coupon.isActive}
                        startsAt={coupon.startsAt}
                        endsAt={coupon.endsAt}
                      />
                    </div>

                    <Button asChild variant="outline" size="sm" className="shrink-0 h-9">
                      <Link href={`/admin/coupons/${coupon.id}`}>
                        Edit <ArrowRight className="ml-2 w-3 h-3" />
                      </Link>
                    </Button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
