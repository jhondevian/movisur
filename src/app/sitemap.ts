import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-metadata";
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

function url(path: string) {
  return new URL(path, siteUrl).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, licenses, rentals] = await Promise.all([
    prisma.movisurProductFile.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.creatorLicenseProduct.findMany({
      where: {
        isActive: true,
        offers: {
          some: {
            isActive: true,
            plan: { isActive: true },
            accounts: {
              some: {
                isActive: true,
                OR: [{ assignedToId: null }, { assignedExpiresAt: { lt: new Date() } }],
              },
            },
          },
        },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.creatorRentalTool.findMany({
      where: {
        isActive: true,
        offers: {
          some: {
            isActive: true,
            plan: { isActive: true },
            accounts: {
              some: {
                isActive: true,
                OR: [{ assignedToId: null }, { assignedExpiresAt: { lt: new Date() } }],
              },
            },
          },
        },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
  ]);

  return [
    {
      url: url("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: url("/informacion"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...products.map((product) => ({
      url: url(`/productos/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...licenses.map((product) => ({
      url: url(`/licencias/${product.id}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...rentals.map((tool) => ({
      url: url(`/alquiler/${tool.id}`),
      lastModified: tool.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
