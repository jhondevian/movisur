import bcrypt from "bcryptjs";
import { createAuthToken, type AuthUser } from "@/lib/auth";
import { databaseAuthMessage, isDatabaseAuthError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { defaultUserRole } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const registerIpRateLimit = {
  limit: 5,
  windowMs: 30 * 60_000,
  blockMs: 60 * 60_000,
};

const registerEmailRateLimit = {
  limit: 3,
  windowMs: 30 * 60_000,
  blockMs: 60 * 60_000,
};

type MobileRegisterBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  termsAccepted?: boolean;
};

function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { message: "Demasiados registros. Intenta nuevamente mas tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MobileRegisterBody;
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: "Completa todos los campos obligatorios." },
        { status: 400 }
      );
    }

    const ipLimit = checkRateLimit(
      getRateLimitKey(request, "mobile-auth-register-ip"),
      registerIpRateLimit
    );
    if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfter);

    const emailLimit = checkRateLimit(
      `mobile-auth-register-email:${email}`,
      registerEmailRateLimit
    );
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfter);

    if (!body.termsAccepted) {
      return NextResponse.json(
        { message: "Debes aceptar los terminos y condiciones." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "La contrasena debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: defaultUserRole,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
      },
    });

    const safeUser: AuthUser = user;
    const accessToken = await createAuthToken(safeUser, true);

    return NextResponse.json(
      {
        accessToken,
        tokenType: "Bearer",
        expiresIn: 60 * 60 * 24 * 30,
        user: safeUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (isDatabaseAuthError(error)) {
      return NextResponse.json(
        { message: databaseAuthMessage() },
        { status: 500 }
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con este correo." },
        { status: 409 }
      );
    }

    console.error("Mobile register error", error);
    return NextResponse.json(
      { message: "No se pudo crear la cuenta." },
      { status: 500 }
    );
  }
}
