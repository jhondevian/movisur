import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import FrontendInfoBody from "@/components/frontend/FrontendInfoBody";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Informacion | Movisur Tool",
  description:
    "Informacion sobre Movisur Tool, descargas, versiones y compatibilidad.",
};

export default function InformacionPage() {
  return (
    <>
      <FrontendHeader />
      <FrontendInfoBody />
      <FrontendFooter />
    </>
  );
}
