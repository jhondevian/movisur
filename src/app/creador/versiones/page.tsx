import RoleDashboard from "@/components/workspace/RoleDashboard";

export default function CreadorVersionesPage() {
  return (
    <RoleDashboard
      title="Versiones"
      description="Versiones preparadas por el creador."
      stats={[
        { label: "Borradores", value: "0" },
        { label: "En revision", value: "0" },
        { label: "Publicadas", value: "0" },
      ]}
      actions={["Crear borrador", "Enviar version", "Revisar cambios"]}
    />
  );
}
