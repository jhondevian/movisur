export const roles = ["admin", "moderador", "creador", "usuario"] as const;

export type UserRole = (typeof roles)[number];

export const defaultUserRole: UserRole = "usuario";

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  moderador: "Moderador",
  creador: "Creador",
  usuario: "Usuario",
};

export const roleDescriptions: Record<UserRole, string> = {
  admin: "Control total del panel, usuarios, configuracion y operaciones.",
  moderador: "Revisa contenido compartido, gestiona reportes y mantiene el orden.",
  creador: "Sube, organiza y comparte archivos o recursos dentro de Movisur.",
  usuario: "Accede a recursos permitidos y consulta informacion operativa.",
};

export function isUserRole(role: string): role is UserRole {
  return roles.includes(role as UserRole);
}
