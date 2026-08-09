import Badge from "@/components/ui/badge/Badge";
import type { MovisurProductFile } from "@/generated/prisma/client";
import Link from "next/link";

type ProductFileWithCategory = MovisurProductFile & {
  category: { name: string } | null;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
};

type MovisurProductFilesTableProps = {
  files: ProductFileWithCategory[];
  editBasePath?: string;
  showOwner?: boolean;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileTypeLabel(file: MovisurProductFile) {
  if (file.fileType === "video") return "Video";
  if (file.fileType === "file") return "Archivo";
  if (file.fileType === "zip") return "ZIP";
  return file.distribution === "file" ? "Archivo subido" : "URL externa";
}

export default function MovisurProductFilesTable({
  files,
  editBasePath = "/admin/archivos",
  showOwner = false,
}: MovisurProductFilesTableProps) {
  const headers = [
    { label: "Producto", className: "w-[28%]" },
    { label: "Imagen", className: "hidden w-[8%] sm:table-cell" },
    { label: "Categoria", className: "hidden w-[12%] md:table-cell" },
    ...(showOwner
      ? [{ label: "Subido por", className: "hidden w-[18%] xl:table-cell" }]
      : []),
    { label: "Distribucion", className: "hidden w-[12%] lg:table-cell" },
    { label: "Tamano", className: "hidden w-[10%] xl:table-cell" },
    { label: "Descargas", className: "hidden w-[10%] xl:table-cell" },
    { label: "Venta", className: "w-[10%]" },
    { label: "Estado", className: "w-[10%]" },
    { label: "Acciones", className: "w-[12%] text-right" },
  ];

  return (
    <div className="overflow-hidden">
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
              {headers.map((header) => (
                <th
                  key={header.label}
                  className={`px-2 py-4 font-medium sm:px-3 ${header.className}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-2 py-4 sm:px-3">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {file.description || "Sin descripcion"}
                  </p>
                </td>
                <td className="hidden px-2 py-4 sm:table-cell sm:px-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    {file.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.imageUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-500">
                        {file.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-2 py-4 text-sm text-gray-700 dark:text-gray-300 md:table-cell sm:px-3">
                  {file.category?.name || "-"}
                </td>
                {showOwner ? (
                  <td className="hidden px-2 py-4 xl:table-cell sm:px-3">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {file.creator
                        ? `${file.creator.firstName} ${file.creator.lastName}`.trim()
                        : "Sin propietario"}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {file.creator
                        ? `${file.creator.email} - ${file.creator.role}`
                        : "Archivo anterior"}
                    </p>
                  </td>
                ) : null}
                <td className="hidden px-2 py-4 text-sm text-brand-500 lg:table-cell sm:px-3">
                  {getFileTypeLabel(file)}
                </td>
                <td className="hidden px-2 py-4 text-sm text-gray-700 dark:text-gray-300 xl:table-cell sm:px-3">
                  {formatSize(file.fileSize)}
                </td>
                <td className="hidden px-2 py-4 text-sm text-gray-700 dark:text-gray-300 xl:table-cell sm:px-3">
                  {file.downloads}
                </td>
                <td className="px-2 py-4 sm:px-3">
                  <Badge size="sm" color={file.isForSale ? "success" : "light"}>
                    {file.isForSale ? "Venta" : "-"}
                  </Badge>
                </td>
                <td className="px-2 py-4 sm:px-3">
                  <Badge size="sm" color={file.isActive ? "success" : "light"}>
                    {file.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-2 py-4 text-right sm:px-3">
                  <Link
                    href={`${editBasePath}/${file.id}/edit`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
