import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthService } from "@/server/services/auth.service";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    await AuthService.requireRole(request.headers, UserRole.ADMIN);

    const resolvedParams = await params;
    const { customerId } = resolvedParams;

    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status value provided" },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // Check if the user exists and is a CUSTOMER
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Security: Do not allow ADMIN to change another ADMIN's status via this endpoint
    if (user.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Cannot modify an admin account through the customer endpoint" },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: customerId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update customer status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
