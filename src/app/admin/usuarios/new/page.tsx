import AdminCreateUserForm from "@/components/admin/AdminCreateUserForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuevo usuario | Movisur",
  description: "Crear usuario desde el panel administrativo.",
};

export default function AdminNewUsuarioPage() {
  return <AdminCreateUserForm />;
}
