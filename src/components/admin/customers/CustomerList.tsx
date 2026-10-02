"use client";

import Link from "next/link";
import { UserRole, UserStatus } from "@prisma/client";
import { Search, UserCircle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type CustomerSummary = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  _count?: {
    orders: number;
  };
};

export function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-card border rounded-sm p-4 flex items-center shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 w-full"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {filteredCustomers.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <UserCircle className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium text-foreground">No customers found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {customers.length === 0
                ? "There are no customers in the system yet."
                : "No customers match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden border">
          <div className="divide-y divide-border">
            {filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="block hover:bg-muted/5 transition-colors p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Context (Name/Email) */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground truncate text-base">
                        {customer.name || "Unnamed Customer"}
                      </p>
                      <div className="sm:hidden">
                        <Badge
                          variant={customer.status === "ACTIVE" ? "success" : "destructive"}
                          className="uppercase text-[10px] tracking-wider font-semibold"
                        >
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">📞 {customer.phone}</p>
                    )}
                  </div>

                  {/* Right Column: Metrics, Status */}
                  <div className="flex flex-row items-center justify-between sm:justify-end gap-6 sm:w-auto shrink-0">
                    {/* Metrics Stack */}
                    <div className="flex flex-col items-start sm:items-end gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Orders:</span>
                        <span className="font-medium text-foreground">
                          {customer._count?.orders ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Joined:</span>
                        <span className="font-medium">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <Badge
                        variant={customer.status === "ACTIVE" ? "success" : "destructive"}
                        className="uppercase text-[10px] tracking-wider font-semibold"
                      >
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
