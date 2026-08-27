import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedCategoryTypes = new Set(["brand", "tool"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
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

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const categoryType = getString(formData, "categoryType");
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

  let imageUrl: string | null = null;

  try {
    if (file instanceof File && file.size > 0) {
      imageUrl = await saveImage(file);
    }

    const codeBase = slugify(name) || "marca";
    let code = codeBase;
    let suffix = 1;

    while (await prisma.movisurBrandCategory.findUnique({ where: { code } })) {
      suffix += 1;
      code = `${codeBase}-${suffix}`.slice(0, 40);
    }

    const category = await prisma.movisurBrandCategory.create({
      data: {
        name,
        code,
        categoryType: allowedCategoryTypes.has(categoryType)
          ? categoryType
          : "brand",
        description,
        imageUrl,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la categoria.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
