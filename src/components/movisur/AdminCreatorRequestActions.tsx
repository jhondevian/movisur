"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminCreatorRequestActionsProps = {
  id: string;
  status: string;
};

export default function AdminCreatorRequestActions({
  id,
  status,
}: AdminCreatorRequestActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function submit(action: "approve" | "reject") {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/creator-requests/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (status !== "pending") {
    return <span className="text-sm text-gray-400">Revisada</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => submit("approve")}
        disabled={isLoading}
        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
      >
        Aprobar
      </button>
      <button
        type="button"
        onClick={() => submit("reject")}
        disabled={isLoading}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
      >
        Rechazar
      </button>
    </div>
  );
}
