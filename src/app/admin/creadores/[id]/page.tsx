import AdminUserDetailForm from "@/components/admin/AdminUserDetailForm";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle de creador | Movisur",
  description: "Administra datos y contraseña de un creador Movisur.",
};

function formatDate(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminCreadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "creador" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <AdminUserDetailForm
      backHref="/admin/creadores"
      user={{
        ...user,
        createdAt: formatDate(user.createdAt) || "-",
        lastLoginAt: formatDate(user.lastLoginAt),
      }}
    />
  );
}
