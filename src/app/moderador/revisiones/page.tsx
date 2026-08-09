import RoleDashboard from "@/components/workspace/RoleDashboard";

export default function ModeradorRevisionesPage() {
  return (
    <RoleDashboard
      title="Revisiones"
      description="Solicitudes pendientes para moderacion."
      stats={[
        { label: "Pendientes", value: "0" },
        { label: "Aprobadas", value: "0" },
        { label: "Observadas", value: "0" },
      ]}
      actions={["Revisar archivos", "Aprobar cambios", "Enviar observacion"]}
    />
  );
}
