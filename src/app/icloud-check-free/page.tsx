import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import IcloudCheckTool from "@/components/icloud/IcloudCheckTool";
import { absoluteUrl, siteUrl } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free iCloud Check | iCloud Check por IMEI o Serial",
  description:
    "Free iCloud Check en Movisur: consulta IMEI o serial Apple para revisar informacion de equipo, iCloud, Find My iPhone y datos disponibles del dispositivo.",
  keywords: [
    "free icloud check",
    "icloud check",
    "icloud check free",
    "imei icloud check",
    "apple serial check",
    "find my iphone check",
    "activation lock check",
    "movisur icloud check",
  ],
  alternates: {
    canonical: absoluteUrl("/icloud-check-free"),
  },
  openGraph: {
    title: "Free iCloud Check",
    description:
      "Consulta IMEI o serial Apple desde Movisur para revisar informacion disponible del dispositivo.",
    url: absoluteUrl("/icloud-check-free"),
    siteName: "Movisur",
    type: "website",
    locale: "es_PE",
  },
  twitter: {
    card: "summary",
    title: "Free iCloud Check",
    description:
      "Consulta IMEI o serial Apple desde Movisur para revisar informacion disponible del dispositivo.",
  },
};

export default function IcloudCheckFreePage() {
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free iCloud Check",
    alternateName: ["iCloud Check Free", "IMEI iCloud Check"],
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/icloud-check-free`,
    provider: {
      "@type": "Organization",
      name: "Movisur",
      url: siteUrl,
    },
    description:
      "Herramienta web para consultar IMEI o serial Apple y revisar informacion disponible del dispositivo.",
  };

  return (
    <>
      <FrontendHeader />
      <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
        />
        <section className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950">
          <div className="mx-auto w-full max-w-7xl px-5 py-14 text-center sm:px-6 lg:px-8">
            <h1 className="mx-auto max-w-5xl text-[40px] font-extrabold leading-tight text-gray-950 dark:text-white sm:text-[58px]">
              Free iCloud Check
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-400">
              Consulta IMEI o serial Apple para revisar informacion disponible
              del dispositivo, iCloud, Find My iPhone y datos relacionados desde
              Movisur.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <IcloudCheckTool />
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "iCloud Check",
                text: "Revisa datos disponibles asociados a un IMEI o serial Apple desde una consulta directa.",
              },
              {
                title: "Find My iPhone",
                text: "Consulta informacion disponible sobre estado iCloud y Find My iPhone cuando el proveedor lo entrega.",
              },
              {
                title: "Soporte tecnico",
                text: "Pensado para verificaciones rapidas en procesos de soporte, compra o revision de equipos.",
              },
            ].map((item) => (
              <article key={item.title}>
                <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <FrontendFooter />
    </>
  );
}
