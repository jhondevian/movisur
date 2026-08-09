import { redirect } from "next/navigation";

export default function AdminSolicitudesRedirectPage() {
  redirect("/admin/creadores/solicitudes");
}
