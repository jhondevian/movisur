import AppShell from "@/layout/AppShell";
import React from "react";

export default function CreadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell sidebarVariant="creador">{children}</AppShell>;
}
