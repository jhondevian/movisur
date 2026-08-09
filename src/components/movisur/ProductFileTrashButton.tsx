"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProductFileTrashButtonProps = {
  productFileId: string;
  returnPath: string;
};

export default function ProductFileTrashButton({
  productFileId,
  returnPath,
}: ProductFileTrashButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setMessage("");

    const response = await fetch(
      `/api/admin/movisur/product-files/${productFileId}`,
      {
        method: "DELETE",
      }
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(payload?.message ?? "No se pudo eliminar el archivo.");
      setIsDeleting(false);
      return;
    }

    router.push(returnPath);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-3">
      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center rounded-lg border border-error-200 bg-white px-5 py-3 text-sm font-semibold text-error-600 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/30 dark:bg-gray-900 dark:text-error-300 dark:hover:bg-error-500/10"
        >
          {isDeleting ? "Eliminando..." : "Eliminar archivo"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-medium text-error-700 dark:text-error-300">
          {message}
        </p>
      ) : null}
    </div>
  );
}
