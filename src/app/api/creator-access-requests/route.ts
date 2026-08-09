import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Inicia sesion para enviar tu solicitud." },
      { status: 401 }
    );
  }

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const publicName = String(formData.get("publicName") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const image = formData.get("image");

  if (!publicName || !country) {
    return NextResponse.json(
      { message: "Completa nombre publico y pais." },
      { status: 400 }
    );
  }

  if (message.length > 800) {
    return NextResponse.json(
      { message: "La solicitud no debe superar 800 caracteres." },
      { status: 400 }
    );
  }

  let imageUrl: string | undefined;

  if (image instanceof File && image.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { message: "Sube una imagen PNG, JPG o WebP." },
        { status: 400 }
      );
    }

    if (image.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: "La imagen no debe superar 2 MB." },
        { status: 400 }
      );
    }

    const extension =
      image.type === "image/png"
        ? "png"
        : image.type === "image/webp"
        ? "webp"
        : "jpg";
    const fileName = `${authUser.id}-${Date.now()}.${extension}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "creator-requests"
    );

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, fileName),
      Buffer.from(await image.arrayBuffer())
    );

    imageUrl = `/uploads/creator-requests/${fileName}`;
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  if (user.role === "creador") {
    return NextResponse.json(
      { message: "Tu cuenta ya tiene acceso de creador." },
      { status: 400 }
    );
  }

  const pending = await prisma.creatorAccessRequest.findFirst({
    where: {
      userId: authUser.id,
      status: "pending",
    },
    select: { id: true },
  });

  if (pending) {
    return NextResponse.json(
      { message: "Ya tienes una solicitud pendiente." },
      { status: 409 }
    );
  }

  const recentRequests = await prisma.creatorAccessRequest.count({
    where: {
      userId: authUser.id,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
  });

  if (recentRequests >= 3) {
    return NextResponse.json(
      { message: "Espera un momento antes de enviar otra solicitud." },
      { status: 429 }
    );
  }

  const creatorRequest = await prisma.creatorAccessRequest.create({
    data: {
      userId: authUser.id,
      publicName,
      country,
      specialty: specialty || null,
      whatsapp: whatsapp || null,
      imageUrl: imageUrl || null,
      message: message || null,
    },
  });

  await prisma.adminNotification.create({
    data: {
      type: "creator_access_request",
      title: "Nueva solicitud de creador",
      message: `${publicName} quiere unirse como creador desde ${country}.`,
      metadata: JSON.stringify({
        requestId: creatorRequest.id,
        userId: authUser.id,
        publicName,
        country,
        specialty,
        whatsapp,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
