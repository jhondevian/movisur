import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const user = await verifyAuthToken(token);

    if (user.role !== "creador") {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.movisurProductFile.count({
      where: {
        createdById: user.id,
        deletedAt: {
          not: null,
        },
      },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
