import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = await verifyMobileAuth(request);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    })),
  });
}
