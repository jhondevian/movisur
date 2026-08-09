import { authCookieName, createAuthToken, setAuthCookie, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  let authUser;

  try {
    authUser = await verifyAuthToken(token);
  } catch {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const phone = getString(formData, "phone");
  const avatar = formData.get("avatar");

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { message: "Completa nombres, apellidos y correo." },
      { status: 400 }
    );
  }

  let avatarUrl: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(avatar.type)) {
      return NextResponse.json(
        { message: "Sube una imagen PNG, JPG o WebP." },
        { status: 400 }
      );
    }

    if (avatar.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: "La imagen no debe superar 2 MB." },
        { status: 400 }
      );
    }

    const extension =
      avatar.type === "image/png"
        ? "png"
        : avatar.type === "image/webp"
        ? "webp"
        : "jpg";
    const fileName = `${authUser.id}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(
      path.join(uploadDir, fileName),
      Buffer.from(await avatar.arrayBuffer())
    );

    avatarUrl = `/uploads/profiles/${fileName}`;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
      },
    });

    const response = NextResponse.json({ user: updatedUser });
    const newToken = await createAuthToken({
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
    });
    setAuthCookie(response, newToken);

    return response;
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

    console.error("Update profile error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar el perfil." },
      { status: 500 }
    );
  }
}
