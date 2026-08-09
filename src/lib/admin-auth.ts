import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

const adminRoles = new Set(["admin", "moderador", "creador"]);

export async function requireAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return null;

  try {
    const user = await verifyAuthToken(token);
    if (!adminRoles.has(user.role)) return null;

    return user;
  } catch {
    return null;
  }
}
