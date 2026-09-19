import { Metadata } from "next";
import { headers } from "next/headers";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { CustomerList } from "@/components/admin/customers/CustomerList";

export const metadata: Metadata = {
  title: "Customers | AHANKARA STUDIOS Admin",
};

export default async function AdminCustomersPage() {
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  const rawUsers = await prisma.user.findMany({
    where: {
      role: UserRole.CUSTOMER,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  const customers = JSON.parse(JSON.stringify(rawUsers));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Customers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store's customer accounts.
          </p>
        </div>
      </div>

      <CustomerList customers={customers} />
    </div>
  );
}
