"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserRole, UserStatus } from "@prisma/client";
import { ArrowLeft, User, MapPin, ShoppingBag, ShieldAlert } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/customers"
          className="p-2 text-gray-500 hover:text-gray-900 bg-white rounded-full shadow-sm hover:shadow"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            {customer.name || "Unnamed Customer"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Info Card */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3 text-lg font-medium text-gray-900 border-b pb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h3>Customer Details</h3>
          </div>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gray-500">Account ID</dt>
              <dd className="font-mono mt-1 text-gray-900">{customer.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Role</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {customer.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-1">
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                  disabled={isUpdating || customer.role === 'ADMIN'}
                  className={`block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${isUpdating ? 'opacity-50' : ''}`}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
                {customer.role === 'ADMIN' && (
                  <p className="mt-1 flex items-center text-xs text-red-500">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Cannot modify admin status.
                  </p>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="mt-1 text-gray-900">{customer.phone || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Joined</dt>
              <dd className="mt-1 text-gray-900">{new Date(customer.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Addresses */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="flex items-center space-x-3 text-lg font-medium text-gray-900 border-b pb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3>Addresses ({customer.addresses.length})</h3>
          </div>

          {customer.addresses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No addresses saved.</p>
          ) : (
            <ul className="space-y-4">
              {customer.addresses.map((address) => (
                <li key={address.id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-gray-900">{address.fullName}</p>
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>{address.city}, {address.state} {address.postalCode}</p>
                  <p>{address.country}</p>
                  <p className="text-gray-500 mt-1">📞 {address.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6 lg:col-span-3">
          <div className="flex items-center space-x-3 text-lg font-medium text-gray-900 border-b pb-4">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            <h3>Order History ({customer.orders.length})</h3>
          </div>

          {customer.orders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fulfillment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.orders.map((order) => {
                    const total = order.subtotal + order.shippingAmount + order.taxAmount - order.discountAmount;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          <Link href={`/admin/orders/${order.id}`}>
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.paymentStatus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.fulfillmentStatus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {formatPrice(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
