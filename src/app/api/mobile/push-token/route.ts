import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PushTokenBody = {
  deviceId?: string;
  platform?: string;
  token?: string;
};

export async function POST(request: NextRequest) {
  const user = await verifyMobileAuth(request);

  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PushTokenBody | null;
  const token = body?.token?.trim();

  if (!token) {
    return NextResponse.json(
      { message: "Token de notificaciones requerido." },
      { status: 400 }
    );
  }

  await prisma.mobilePushToken.upsert({
    where: { token },
    create: {
      userId: user.id,
      token,
      platform: body?.platform?.trim() || null,
      deviceId: body?.deviceId?.trim() || null,
      isActive: true,
      lastSeenAt: new Date(),
    },
    update: {
      userId: user.id,
      platform: body?.platform?.trim() || null,
      deviceId: body?.deviceId?.trim() || null,
      isActive: true,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
