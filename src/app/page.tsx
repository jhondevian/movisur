import FrontendBody from "@/components/frontend/FrontendBody";
import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  const [categories, productFiles, licenseProducts, rentalTools] = await Promise.all([
    prisma.movisurBrandCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    }),
    prisma.movisurProductFile.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        imageUrl: true,
        downloadUrl: true,
        categoryId: true,
        isForSale: true,
        fileType: true,
        category: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
    }),
    prisma.creatorLicenseProduct.findMany({
      where: {
        isActive: true,
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        offers: {
          where: {
            isActive: true,
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
    prisma.creatorRentalTool.findMany({
      where: {
        isActive: true,
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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        offers: {
          where: {
            isActive: true,
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
  ]);
  const confirmedPurchase = userId
    ? await prisma.adminNotification.findFirst({
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
    : null;

  return (
    <>
      <FrontendHeader />
      <FrontendBody
        categories={categories}
        creatorCommerceSections={[
          {
            title: "Licencias",
            items: licenseProducts.map((product) => ({
              id: product.id,
              productUrl: `/licencias/${product.id}`,
              title: product.name,
              text: product.description,
              imageUrl: product.imageUrl,
              price: product.offers[0]?.price.toString() ?? "0",
              currency: product.offers[0]?.currency ?? "USD",
            })),
          },
          {
            title: "Alquiler",
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
        productFiles={productFiles}
      />
      <FrontendFooter />
    </>
  );
}
