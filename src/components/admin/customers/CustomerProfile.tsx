"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserRole, UserStatus } from "@prisma/client";
import { ArrowLeft, User, MapPin, ShoppingBag, ShieldAlert, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  createdAt: string;
};

type CustomerData = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  addresses: Address[];
  orders: Order[];
};

export function CustomerProfile({ customer }: { customer: CustomerData }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>(customer.status);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setCurrentStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update customer status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-full" aria-label="Back to customers list">
          <Link href="/admin/customers">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-medium tracking-tight text-foreground flex items-center">
            {customer.name || "Unnamed Customer"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Info Card */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="flex items-center text-lg space-x-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span>Customer Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Account ID</dt>
                <dd className="font-mono text-foreground">{customer.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Role</dt>
                <dd>
                  <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">
                    {customer.role}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Status</dt>
                <dd>
                  <Select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                    disabled={isUpdating || customer.role === 'ADMIN'}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DEACTIVATED">Deactivated</option>
                  </Select>
                  {customer.role === 'ADMIN' && (
                    <p className="mt-2 flex items-center text-xs text-destructive">
                      <ShieldAlert className="w-3 h-3 mr-1" /> Cannot modify admin status.
                    </p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Phone</dt>
                <dd className="text-foreground font-medium">{customer.phone || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Joined</dt>
                <dd className="text-foreground font-medium">{new Date(customer.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle className="flex items-center text-lg space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>Addresses ({customer.addresses.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No addresses saved.</p>
            ) : (
              <ul className="space-y-4">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="text-sm text-foreground bg-muted/30 border border-border/50 p-4 rounded-sm">
                    <p className="font-semibold mb-1">{address.fullName}</p>
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.country}</p>
                    <p className="text-muted-foreground mt-2 font-medium">📞 {address.phone}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-lg space-x-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              <span>Order History ({customer.orders.length})</span>
            </CardTitle>
          </CardHeader>

          {customer.orders.length === 0 ? (
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-foreground">No orders placed yet.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {customer.orders.map((order) => {
                const total = order.subtotal + order.shippingAmount + order.taxAmount - order.discountAmount;
                return (
                  <div key={order.id} className="p-4 sm:p-5 hover:bg-muted/5 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                      {/* Left: Order Info & Date */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-semibold text-foreground hover:underline">
                            {order.orderNumber}
                          </Link>
                          <div className="md:hidden">
                            <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Right: Payment, Fulfillment, Status, Action */}
                      <div className="flex flex-row items-center justify-between md:justify-end gap-6 md:w-auto shrink-0">
                        <div className="flex flex-col items-start md:items-end gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">Total:</span>
                            <span className="font-bold text-foreground">
                              {formatPrice(total)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{order.paymentStatus}</span>
                            <span>•</span>
                            <span>{order.fulfillmentStatus}</span>
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <Badge variant="secondary" className="uppercase text-[10px] tracking-wider font-semibold">
                            {order.status}
                          </Badge>
                        </div>

                        <Button asChild variant="outline" size="sm" className="shrink-0 h-9">
                          <Link href={`/admin/orders/${order.id}`}>
                            View <ArrowRight className="ml-2 w-3 h-3" />
                          </Link>
                        </Button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
