import MovisurAppReleaseForm from "@/components/movisur/MovisurAppReleaseForm";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar APK | Movisur",
  description: "Editar una version APK de la aplicacion Movisur",
};

export default async function EditMovisurAppReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const release = await prisma.movisurAppRelease.findUnique({
    where: { id },
  });

  if (!release) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/apk"
          className="text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          Volver a APK
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          Editar APK
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Actualiza v{release.version} build {release.buildNumber}.
        </p>
      </div>

      <MovisurAppReleaseForm initialRelease={release} />
    </div>
  );
}
