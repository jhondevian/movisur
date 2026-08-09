import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    password?: string;
    confirmPassword?: string;
  };

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const role = String(body.role || "").trim();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { message: "Completa nombres, apellidos y correo." },
      { status: 400 }
    );
  }

  if (!isUserRole(role)) {
    return NextResponse.json({ message: "Rol invalido." }, { status: 400 });
  }

  if (password || confirmPassword) {
    if (password.length < 8) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Las contraseñas no coinciden." },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "El usuario no existe." },
      { status: 404 }
    );
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese correo." },
        { status: 409 }
      );
    }

    console.error("Admin update user error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar el usuario." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
