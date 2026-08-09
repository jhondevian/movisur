import RoleDashboard from "@/components/workspace/RoleDashboard";

export default function ModeradorReportesPage() {
  return (
    <RoleDashboard
      title="Reportes"
      description="Actividad y reportes del sistema."
      stats={[
        { label: "Reportes", value: "0" },
        { label: "Alertas", value: "0" },
        { label: "Estado", value: "Normal" },
      ]}
      actions={["Ver actividad", "Revisar alertas", "Cerrar reporte"]}
    />
  );
}
