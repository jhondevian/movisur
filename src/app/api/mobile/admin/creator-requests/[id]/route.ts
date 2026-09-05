import { verifyMobileAuth } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type CreatorRequestActionBody = {
  action?: string;
};

function parseMetadata(metadata: string | null) {
  if (!metadata) return {};

  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await verifyMobileAuth(request);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request
    .json()
    .catch(() => ({}))) as CreatorRequestActionBody;
  const action = body.action === "reject" ? "reject" : "approve";

  const notification = await prisma.adminNotification.findFirst({
    where: {
      id,
      type: "creator_access_request",
      recipientUserId: null,
    },
    select: {
      id: true,
      metadata: true,
    },
  });
  const notificationMetadata = parseMetadata(notification?.metadata ?? null);
  const requestId =
    typeof notificationMetadata.requestId === "string"
      ? notificationMetadata.requestId
      : id;

  const accessRequest = await prisma.creatorAccessRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!accessRequest) {
    return NextResponse.json(
      { message: "La solicitud no existe." },
      { status: 404 },
    );
  }

  if (accessRequest.status !== "pending") {
    return NextResponse.json({ ok: true, status: accessRequest.status });
  }

  const requestStatus = action === "approve" ? "approved" : "rejected";

  await prisma.$transaction(async (tx) => {
    if (action === "approve") {
      await tx.user.update({
        where: { id: accessRequest.userId },
        data: { role: "creador" },
      });
    }

    await tx.creatorAccessRequest.update({
      where: { id: accessRequest.id },
      data: {
        status: requestStatus,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    await tx.adminNotification.updateMany({
      where: {
        type: "creator_access_request",
        metadata: { contains: `"requestId":"${accessRequest.id}"` },
      },
      data: {
        isRead: true,
        metadata: JSON.stringify({
          ...notificationMetadata,
          requestStatus,
          reviewedAt: new Date().toISOString(),
          reviewedById: admin.id,
          reviewedByName: `${admin.firstName} ${admin.lastName}`.trim(),
          reviewedByEmail: admin.email,
        }),
      },
    });
  });

  return NextResponse.json({ ok: true, status: requestStatus });
}
