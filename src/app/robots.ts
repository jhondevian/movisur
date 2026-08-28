import { siteUrl } from "@/lib/site-metadata";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/informacion",
          "/icloud-check-free",
          "/frp-bypass",
          "/productos",
          "/licencias",
          "/alquiler",
        ],
        disallow: [
          "/admin",
          "/api",
          "/creador",
          "/moderador",
          "/usuario",
          "/signin",
          "/signup",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
