import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import ProductsCatalog from "@/components/frontend/ProductsCatalog";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos Movisur | Archivos, ROM y herramientas",
  description:
    "Explora productos, archivos, ROM y herramientas disponibles en Movisur con busqueda y filtros por categoria.",
};

type ProductsPageProps = {
  searchParams?: Promise<{
    categoria?: string;
    q?: string;
    tipo?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  let userId = "";

  if (token) {
    try {
      const user = await verifyAuthToken(token);
      userId = user.id;
    } catch {
      userId = "";
    }
  }

  const availableAccountWhere = {
    isActive: true,
    OR: [{ assignedToId: null }, { assignedExpiresAt: { lt: new Date() } }],
  };

  const [categories, products, rentalTools, confirmedPurchase] = await Promise.all([
    prisma.movisurBrandCategory.findMany({
      where: {
        isActive: true,
        showInFrontend: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    }),
    prisma.movisurProductFile.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { categoryId: null },
          {
            category: {
              isActive: true,
              showInFrontend: true,
            },
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        imageUrl: true,
        categoryId: true,
        fileType: true,
        isForSale: true,
        category: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
    }),
    prisma.creatorRentalTool.findMany({
      where: {
        isActive: true,
        OR: [
          { showInFrontend: true },
          {
            offers: {
              some: {
                isActive: true,
                ...(userId ? { creatorId: { not: userId } } : {}),
                accounts: {
                  some: availableAccountWhere,
                },
                plan: { isActive: true },
              },
            },
          },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        offers: {
          where: {
            isActive: true,
            ...(userId ? { creatorId: { not: userId } } : {}),
            accounts: {
              some: availableAccountWhere,
            },
            plan: { isActive: true },
          },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    }),
    userId
      ? prisma.adminNotification.findFirst({
          where: {
            type: "binance_payment_confirmation",
            metadata: {
              contains: `"userId":"${userId}"`,
            },
            AND: [
              {
                metadata: {
                  contains: `"purchaseStatus":"confirmed"`,
                },
              },
            ],
          },
          select: {
            id: true,
          },
        })
      : null,
  ]);

  return (
    <>
      <FrontendHeader />
      <ProductsCatalog
        categories={categories}
        commerceSections={[
          {
            title: "Alquiler",
            type: "alquiler",
            items: rentalTools.map((tool) => ({
              id: tool.id,
              productUrl: `/alquiler/${tool.id}`,
              title: tool.name,
              text: tool.description,
              imageUrl: tool.imageUrl,
              price: tool.offers[0]?.price.toString() ?? "0",
              currency: tool.offers[0]?.currency ?? "USD",
            })),
          },
        ]}
        hasConfirmedPurchase={Boolean(confirmedPurchase)}
        initialCategoryId={params?.categoria}
        initialSearchTerm={params?.q}
        initialType={params?.tipo}
        products={products.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          categoryName: product.category?.name || "Archivos",
          categoryImageUrl: product.category?.imageUrl || null,
          fileType: product.fileType,
          isForSale: product.isForSale,
        }))}
      />
      <FrontendFooter />
    </>
  );
}
