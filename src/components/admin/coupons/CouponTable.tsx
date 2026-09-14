"use client";

import { useState } from "react";
import { AdminCoupon } from "@/types/admin";
import { CouponStatusBadge } from "./CouponStatusBadge";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Link 
          href="/admin/coupons/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                    <div className="text-sm text-gray-500">{coupon.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.type === 'PERCENTAGE' 
                      ? `${coupon.value}%` 
                      : formatPrice(coupon.value)
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon._count?.redemptions || 0}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CouponStatusBadge 
                      isActive={coupon.isActive} 
                      startsAt={coupon.startsAt} 
                      endsAt={coupon.endsAt} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/admin/coupons/${coupon.id}`} className="text-blue-600 hover:text-blue-900">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              
              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    {initialCoupons.length === 0 
                      ? "No coupons have been created yet." 
                      : "No coupons match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
