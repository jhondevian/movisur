import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReportRouteProps = {
  params: Promise<{ id: string }>;
};

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 500) : fallback;
}

export async function POST(request: Request, { params }: ReportRouteProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const payload = (await request.json().catch(() => null)) as {
    reason?: string;
    details?: string;
  } | null;

  const reason = cleanText(payload?.reason, "No descarga").slice(0, 80);
  const details = cleanText(payload?.details);

  const product = await prisma.movisurProductFile.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      fileName: true,
      category: { select: { name: true } },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json(
      { message: "Archivo no encontrado." },
      { status: 404 }
    );
  }

  const reporterName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : "Visitante";
  const productHref = `/productos/${product.slug}`;

  await prisma.adminNotification.create({
    data: {
      type: "file_report",
      title: "Reporte de archivo caido",
      message: `${reason}: ${product.name}`,
      metadata: JSON.stringify({
        productFileId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productHref,
        fileName: product.fileName,
        categoryName: product.category?.name,
        reason,
        details,
        reporterUserId: user?.id,
        reporterName,
        reporterEmail: user?.email,
        ownerId: product.creator?.id,
        ownerName: product.creator
          ? `${product.creator.firstName} ${product.creator.lastName}`.trim()
          : null,
        ownerEmail: product.creator?.email,
        reportedAt: new Date().toISOString(),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
