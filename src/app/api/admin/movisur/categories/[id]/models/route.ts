import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const name = getString(formData, "name");
  const code = getString(formData, "code");
  const details = getString(formData, "details");
  const yearValue = Number.parseInt(getString(formData, "year"), 10);
  const sortOrder = Number.parseInt(getString(formData, "sortOrder"), 10) || 0;

  if (!name) {
    return NextResponse.json(
      { message: "El modelo es obligatorio." },
      { status: 400 }
    );
  }

  const category = await prisma.movisurBrandCategory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!category) {
    return NextResponse.json(
      { message: "La marca no existe." },
      { status: 404 }
    );
  }

  const model = await prisma.movisurDeviceModel.create({
    data: {
      categoryId: id,
      code: code || null,
      details: details || null,
      isActive: true,
      name,
      sortOrder,
      year: Number.isFinite(yearValue) ? yearValue : null,
    },
  });

  return NextResponse.json({ model }, { status: 201 });
}
