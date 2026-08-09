import { requireAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const admin = await requireAdminUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

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

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json(
      { message: "Completa nombres, apellidos, correo y contraseña." },
      { status: 400 }
    );
  }

  if (!isUserRole(role)) {
    return NextResponse.json({ message: "Rol inválido." }, { status: 400 });
  }

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

  try {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role,
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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

    console.error("Admin create user error", error);
    return NextResponse.json(
      { message: "No se pudo crear el usuario." },
      { status: 500 }
    );
  }
}
