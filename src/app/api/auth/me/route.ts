import {
  authCookieName,
  createAuthToken,
  setAuthCookie,
  verifyAuthToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const tokenUser = await verifyAuthToken(token);
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
      return NextResponse.json({ user: null });
    }

    const response = NextResponse.json({ user });
    const refreshedToken = await createAuthToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });
    setAuthCookie(response, refreshedToken);

    return response;
  } catch {
    return NextResponse.json({ user: null });
  }
}
