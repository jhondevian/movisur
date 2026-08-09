import AppShell from "@/layout/AppShell";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell sidebarVariant="admin">{children}</AppShell>;
}
