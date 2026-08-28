import { createAuthToken, type AuthUser } from "@/lib/auth";
import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const tokenUser = await verifyMobileAuth(request);

  if (!tokenUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const safeUser: AuthUser = user;
  const accessToken = await createAuthToken(safeUser, true);

  return NextResponse.json({
    accessToken,
    tokenType: "Bearer",
    expiresIn: 60 * 60 * 24 * 30,
    user: safeUser,
  });
}
