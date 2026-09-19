import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { CustomerProfile } from "@/components/admin/customers/CustomerProfile";

export const metadata: Metadata = {
  title: "Customer Profile | AHANKARA STUDIOS Admin",
};

export default async function AdminCustomerProfilePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const resolvedParams = await params;
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  const rawUser = await prisma.user.findUnique({
    where: {
      id: resolvedParams.customerId,
    },
    include: {
      addresses: true,
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
    },
  });

  if (!rawUser) {
    notFound();
  }

  // Safe serialization for Client Component
  const customer = JSON.parse(JSON.stringify(rawUser));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <CustomerProfile customer={customer} />
    </div>
  );
}
