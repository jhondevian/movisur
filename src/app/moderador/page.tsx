import RoleDashboard from "@/components/workspace/RoleDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Moderador | Movisur",
};

export default function ModeradorPage() {
  return (
    <RoleDashboard
      title="Panel moderador"
      description="Revisa reportes, solicitudes y actividad pendiente."
      stats={[
        { label: "Revisiones", value: "0" },
        { label: "Reportes", value: "0" },
        { label: "Pendientes", value: "0" },
      ]}
      actions={["Revisar solicitudes", "Ver reportes", "Validar actividad"]}
    />
  );
}
