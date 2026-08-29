import {
  getBoolean,
  getString,
  parsePlans,
  saveAdminMovisurImage,
  slugify,
} from "@/lib/admin-movisur-items";
import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function getUniqueSlug(name: string) {
  const base = slugify(name) || "alquiler";
  let slug = base;
  let suffix = 1;

  while (await prisma.creatorRentalTool.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`.slice(0, 140);
  }

  return slug;
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const description = getString(formData, "description");
  const sortOrder = Number(getString(formData, "sortOrder") || 0);
  const isActive = getBoolean(formData, "isActive");
  const showInFrontend = getBoolean(formData, "showInFrontend");
  const plans = parsePlans(getString(formData, "plans"));
  const image = formData.get("image");

  if (!name) {
    return NextResponse.json(
      { message: "El nombre de la tool es obligatorio." },
      { status: 400 }
    );
  }

  try {
    const imageUrl =
      image instanceof File && image.size > 0
        ? await saveAdminMovisurImage(image, "rental-tools")
        : null;
    const slug = await getUniqueSlug(name);
    const item = await prisma.creatorRentalTool.create({
      data: {
        name,
        slug,
        description,
        imageUrl,
        sortOrder,
        isActive,
        showInFrontend,
        plans: {
          create: plans.map((plan) => plan),
        },
      },
      include: { plans: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "No se pudo crear la tool.",
      },
      { status: 500 }
    );
  }
}
