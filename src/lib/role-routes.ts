import type { UserRole } from "@/lib/roles";

export const roleDashboardPaths: Record<UserRole, string> = {
  admin: "/admin",
  moderador: "/moderador",
  creador: "/creador",
  usuario: "/usuario",
};

export function getDashboardPath(role: UserRole) {
  return roleDashboardPaths[role] ?? "/usuario";
}

export function getRequiredRole(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/moderador" || pathname.startsWith("/moderador/")) {
    return "moderador";
  }
  if (pathname === "/creador" || pathname.startsWith("/creador/")) {
    return "creador";
  }
  if (pathname === "/usuario" || pathname.startsWith("/usuario/")) {
    return "usuario";
  }

  return null;
}
