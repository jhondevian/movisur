import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

export function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme.toLowerCase() !== "bearer" || !token) return null;

  return token.trim();
}

export async function verifyMobileAuth(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}
