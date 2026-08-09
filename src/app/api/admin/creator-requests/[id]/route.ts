import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
  };
  const action = body.action === "reject" ? "reject" : "approve";

  const accessRequest = await prisma.creatorAccessRequest.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!accessRequest) {
    return NextResponse.json(
      { message: "La solicitud no existe." },
      { status: 404 }
    );
  }

  if (accessRequest.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

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
        status: action === "approve" ? "approved" : "rejected",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
