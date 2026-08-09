import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createAuthToken, setAuthCookie, type AuthUser } from "@/lib/auth";
import { databaseAuthMessage, isDatabaseAuthError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginIpRateLimit = {
  limit: 12,
  windowMs: 10 * 60_000,
  blockMs: 30 * 60_000,
};

const loginEmailRateLimit = {
  limit: 6,
  windowMs: 10 * 60_000,
  blockMs: 30 * 60_000,
};

type LoginBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { message: "Demasiados intentos. Intenta nuevamente mas tarde." },
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
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Ingresa tu correo y contrasena." },
        { status: 400 }
      );
    }

    const ipLimit = checkRateLimit(
      getRateLimitKey(request, "auth-login-ip"),
      loginIpRateLimit
    );

    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfter);
    }

    const emailLimit = checkRateLimit(
      `auth-login-email:${email}`,
      loginEmailRateLimit
    );

    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit.retryAfter);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        passwordHash: true,
      },
    });
    const isValidPassword =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { message: "Correo o contrasena incorrectos." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const safeUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
    const token = await createAuthToken(safeUser, body.remember);
    const response = NextResponse.json({ user: safeUser });
    setAuthCookie(response, token, body.remember);

    return response;
  } catch (error) {
    if (isDatabaseAuthError(error)) {
      return NextResponse.json(
        { message: databaseAuthMessage() },
        { status: 500 }
      );
    }

    console.error("Login error", error);
    return NextResponse.json(
      { message: "No se pudo iniciar sesion." },
      { status: 500 }
    );
  }
}
