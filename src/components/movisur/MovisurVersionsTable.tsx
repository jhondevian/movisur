import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MovisurVersion } from "@/generated/prisma/client";

type MovisurVersionsTableProps = {
  versions: MovisurVersion[];
  editBasePath?: string;
};

function releaseLabel(releaseType: MovisurVersion["releaseType"]) {
  const labels: Record<MovisurVersion["releaseType"], string> = {
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

export default function MovisurVersionsTable({
  versions,
  editBasePath = "/admin/movisur",
}: MovisurVersionsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[860px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  "VERSION",
                  "TIPO",
                  "DISTRIBUCION",
                  "DESCARGAS",
                  "VENTA",
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
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <span className="block text-theme-sm font-semibold text-gray-900 dark:text-white">
                      v{version.version}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={
                        version.releaseType === "stable"
                          ? "success"
                          : version.releaseType === "beta"
                          ? "warning"
                          : "info"
                      }
                    >
                      {releaseLabel(version.releaseType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-brand-500">
                    {version.distribution === "file"
                      ? "ZIP subido"
                      : "URL externa"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300">
                    {version.downloads}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={version.isSaleVersion ? "success" : "light"}
                    >
                      {version.isSaleVersion ? "Venta" : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color={version.isActive ? "success" : "light"}>
                      {version.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {daysAgo(version.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Link
                      href={`${editBasePath}/${version.id}/edit`}
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
