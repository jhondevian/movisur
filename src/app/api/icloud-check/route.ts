import {
  normalizeIcloudIdentifier,
  runIcloudCheck,
} from "@/lib/icloud-check";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const icloudCheckRateLimit = {
  limit: 8,
  windowMs: 10 * 60_000,
  blockMs: 30 * 60_000,
};

type IcloudCheckPayload = {
  identifier?: string;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    getRateLimitKey(request, "icloud-check"),
    icloudCheckRateLimit
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Demasiadas consultas. Intenta mas tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | IcloudCheckPayload
    | null;
  const identifier = normalizeIcloudIdentifier(payload?.identifier || "");

  if (!identifier || identifier.length < 5 || identifier.length > 32) {
    return NextResponse.json(
      { message: "Ingresa un IMEI o serial valido." },
      { status: 400 }
    );
  }

  try {
    const result = await runIcloudCheck(identifier);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo consultar iCloud Check.",
      },
      { status: 400 }
    );
  }
}
