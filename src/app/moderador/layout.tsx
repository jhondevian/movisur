import AppShell from "@/layout/AppShell";
import React from "react";

export default function ModeradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell sidebarVariant="moderador">{children}</AppShell>;
}
