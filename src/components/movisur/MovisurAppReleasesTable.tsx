import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MovisurAppRelease } from "@/generated/prisma/client";

type MovisurAppReleasesTableProps = {
  releases: MovisurAppRelease[];
};

function releaseLabel(releaseType: MovisurAppRelease["releaseType"]) {
  const labels: Record<MovisurAppRelease["releaseType"], string> = {
    stable: "Stable",
    beta: "Beta",
    alpha: "Alpha",
  };

  return labels[releaseType];
}

function daysAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));

  if (days === 0) return "hoy";
  if (days === 1) return "hace 1d";

  return `hace ${days}d`;
}

export default function MovisurAppReleasesTable({
  releases,
}: MovisurAppReleasesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[980px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "VERSION",
                  "BUILD",
                  "TIPO",
                  "DISTRIBUCION",
                  "AUDIENCIA",
                  "DESCARGAS",
                  "FORZAR",
                  "ESTADO",
                  "FECHA",
                  "ACCIONES",
                ].map((header) => (
                  <TableCell
                    key={header}
                    isHeader
                    className="px-5 py-4 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <span className="block text-theme-sm font-semibold text-gray-900 dark:text-white">
                      v{release.version}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300">
                    {release.buildNumber}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={
                        release.releaseType === "stable"
                          ? "success"
                          : release.releaseType === "beta"
                          ? "warning"
                          : "info"
                      }
                    >
                      {releaseLabel(release.releaseType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-brand-500">
                    {release.distribution === "file"
                      ? "APK subido"
                      : "URL externa"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge size="sm" color={release.showForUsers ? "success" : "light"}>
                        Usuarios
                      </Badge>
                      <Badge
                        size="sm"
                        color={release.showForCreators ? "success" : "light"}
                      >
                        Creadores
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300">
                    {release.downloads}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={release.forceUpdate ? "error" : "light"}>
                      {release.forceUpdate ? "Forzada" : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={release.isActive ? "success" : "light"}>
                      {release.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {daysAgo(release.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/admin/apk/${release.id}/edit`}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
