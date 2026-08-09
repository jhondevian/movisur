import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { absoluteUrl, defaultShareImage, siteUrl } from '@/lib/site-metadata';
import type { Metadata } from 'next';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Movisur Tool | Descargas, licencias y alquiler de herramientas",
    template: "%s | Movisur",
  },
  description:
    "Movisur Tool reúne descargas, productos técnicos, licencias, alquiler de herramientas y recursos para servicios móviles.",
  keywords: [
    "Movisur",
    "Movisur Tool",
    "descargar Movisur",
    "licencias Movisur",
    "alquiler de tools",
    "herramientas móviles",
    "unlock tool",
    "archivos técnicos",
  ],
  alternates: {
    canonical: siteUrl,
  },
  applicationName: "Movisur",
  authors: [{ name: "Movisur" }],
  creator: "Movisur",
  publisher: "Movisur",
  openGraph: {
    title: "Movisur Tool",
    description:
      "Descargas, productos técnicos, licencias y alquiler de herramientas en Movisur.",
    url: siteUrl,
    siteName: "Movisur",
    type: "website",
    locale: "es_PE",
    images: [
      {
        url: absoluteUrl(defaultShareImage),
        width: 512,
        height: 512,
        alt: "Movisur Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Movisur Tool",
    description:
      "Descargas, productos técnicos, licencias y alquiler de herramientas en Movisur.",
    images: [absoluteUrl(defaultShareImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Movisur",
              alternateName: "Movisur Tool",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Movisur",
              url: siteUrl,
              logo: absoluteUrl(defaultShareImage),
            }),
          }}
        />
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
