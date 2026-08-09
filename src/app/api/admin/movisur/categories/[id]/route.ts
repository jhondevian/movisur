import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function saveImage(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Solo se permiten imagenes PNG, JPG o WebP.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("La imagen no debe superar 2 MB.");
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `category-${Date.now()}.${extension}`;
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "movisur",
    "categories"
  );

  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return `/uploads/movisur/categories/${fileName}`;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      isActive?: boolean;
    } | null;

    if (!body || typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { message: "Datos invalidos." },
        { status: 400 }
      );
    }

    const category = await prisma.movisurBrandCategory.update({
      where: { id },
      data: {
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ category });
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const sortOrder = Number(getString(formData, "sortOrder") || 0);
  const isActive = formData.get("isActive") === "on";
  const file = formData.get("image");

  if (!name) {
    return NextResponse.json(
      { message: "El nombre de la marca es obligatorio." },
      { status: 400 }
    );
  }

  try {
    let imageUrl: string | undefined;

    if (file instanceof File && file.size > 0) {
      imageUrl = await saveImage(file);
    }

    const category = await prisma.movisurBrandCategory.update({
      where: { id },
      data: {
        name,
        description,
        sortOrder,
        isActive,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar la categoria.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
