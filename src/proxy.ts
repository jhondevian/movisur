import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { getDashboardPath, getRequiredRole } from "@/lib/role-routes";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  const signInUrl = new URL("/signin", request.url);
  signInUrl.searchParams.set("next", request.nextUrl.pathname);

  if (!token) {
    return NextResponse.redirect(signInUrl);
  }

  try {
    const user = await verifyAuthToken(token);
    const requiredRole = getRequiredRole(request.nextUrl.pathname);

    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(signInUrl);
    response.cookies.delete(authCookieName);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/usuario/:path*", "/creador/:path*", "/moderador/:path*"],
};
