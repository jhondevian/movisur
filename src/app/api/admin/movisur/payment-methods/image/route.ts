import { requireAdminUser } from "@/lib/admin-auth";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const method = formData.get("method");
  const file = formData.get("file");

  if (method !== "binance") {
    return NextResponse.json(
      { message: "Solo Binance permite imagen por ahora." },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json(
      { message: "Selecciona una imagen valida." },
      { status: 400 }
    );
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json(
      { message: "Solo se permiten imagenes PNG, JPG o WebP." },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `binance-${Date.now()}.${extension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "payments"
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return NextResponse.json({
    imageUrl: `/uploads/movisur/payments/${fileName}`,
  });
}
