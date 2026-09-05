import CreatorCommerceBuyBox from "@/components/frontend/CreatorCommerceBuyBox";
import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, cleanSeoText, getShareImage, siteUrl } from "@/lib/site-metadata";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type RentalPageProps = {
  params: Promise<{ id: string }>;
};

function parseDetails(details: string | null) {
  if (!details) return {};

  try {
    return JSON.parse(details) as Record<string, string>;
  } catch {
    return { notes: details };
  }
}

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) return "";

  try {
    const user = await verifyAuthToken(token);
    return user.id;
  } catch {
    return "";
  }
}

export async function generateMetadata({
  params,
}: RentalPageProps): Promise<Metadata> {
  const { id } = await params;
  const tool = await prisma.creatorRentalTool.findFirst({
    where: { id, isActive: true },
    select: { name: true, description: true, imageUrl: true },
  });

  const title = tool ? `${tool.name} | Movisur` : "Alquiler | Movisur";
  const description = tool?.description || "Alquiler disponible en Movisur";
  const image = getShareImage(tool?.imageUrl);

  return {
    title,
    description: cleanSeoText(description, "Alquiler disponible en Movisur"),
    alternates: {
      canonical: `${siteUrl}/alquiler/${id}`,
    },
    openGraph: {
      title: tool?.name || "Alquiler Movisur",
      description: cleanSeoText(description, "Alquiler disponible en Movisur"),
      url: `${siteUrl}/alquiler/${id}`,
      images: [
        {
          url: absoluteUrl(image),
          alt: tool?.name || "Alquiler Movisur",
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: tool?.name || "Alquiler Movisur",
      description: cleanSeoText(description, "Alquiler disponible en Movisur"),
      images: [absoluteUrl(image)],
    },
  };
}

export default async function RentalPage({ params }: RentalPageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const availableAccountWhere = {
    isActive: true,
    OR: [{ assignedToId: null }, { assignedExpiresAt: { lt: new Date() } }],
  };
  const tool = await prisma.creatorRentalTool.findFirst({
    where: { id, isActive: true },
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
        orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
        include: {
          plan: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
              creatorPaymentMethods: {
                where: { isEnabled: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!tool || (!tool.showInFrontend && tool.offers.length === 0)) notFound();
  const lowestOffer = tool.offers[0];
  const toolJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tool.name,
    description: cleanSeoText(tool.description, "Alquiler disponible en Movisur"),
    image: tool.imageUrl ? absoluteUrl(tool.imageUrl) : undefined,
    url: `${siteUrl}/alquiler/${tool.id}`,
    brand: {
      "@type": "Brand",
      name: "Movisur",
    },
    offers: lowestOffer
      ? {
          "@type": "Offer",
          price: lowestOffer.price.toString(),
          priceCurrency: lowestOffer.currency,
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/alquiler/${tool.id}`,
        }
      : undefined,
  };

  const creatorIds = Array.from(
    new Set(tool.offers.map((offer) => offer.creatorId))
  );
  const [reviewStats, userReviews, confirmedPurchases] = await Promise.all([
    prisma.creatorVendorReview.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: creatorIds } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    userId
      ? prisma.creatorVendorReview.findMany({
          where: {
            reviewerId: userId,
            creatorId: { in: creatorIds },
          },
          select: {
            creatorId: true,
            rating: true,
          },
        })
      : [],
    userId
      ? prisma.adminNotification.findMany({
          where: {
            type: "binance_payment_confirmation",
            recipientUserId: { in: creatorIds },
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
          select: { recipientUserId: true },
        })
      : [],
  ]);
  const statsByCreator = new Map(
    reviewStats.map((stat) => [
      stat.creatorId,
      {
        average: stat._avg.rating ?? 0,
        count: stat._count.rating,
      },
    ])
  );
  const userRatingByCreator = new Map(
    userReviews.map((review) => [review.creatorId, review.rating])
  );
  const confirmedCreatorIds = new Set(
    confirmedPurchases
      .map((purchase) => purchase.recipientUserId)
      .filter((creatorId): creatorId is string => Boolean(creatorId))
  );

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <FrontendHeader />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd) }}
      />
      <main className="flex-1 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <CreatorCommerceBuyBox
          nextPath={`/alquiler/${tool.id}`}
          offers={tool.offers.map((offer) => ({
            id: offer.id,
            creatorId: offer.creatorId,
            commerceType: "rental",
            sellerName: `${offer.creator.firstName} ${offer.creator.lastName}`.trim(),
            sellerAvatarUrl: offer.creator.avatarUrl,
            planName: "",
            durationLabel: `${offer.plan.durationMonths} hora${
              offer.plan.durationMonths === 1 ? "" : "s"
            }`,
            price: offer.price.toString(),
            currency: offer.currency,
            ratingAverage:
              statsByCreator.get(offer.creatorId)?.average ?? 0,
            ratingCount: statsByCreator.get(offer.creatorId)?.count ?? 0,
            userRating: userRatingByCreator.get(offer.creatorId) ?? 0,
            canRate: confirmedCreatorIds.has(offer.creatorId),
            paymentMethods: offer.creator.creatorPaymentMethods.map((method) => ({
              code: method.code,
              name: method.name,
              config: parseDetails(method.details),
            })),
          }))}
        />
      </main>
      <FrontendFooter />
    </div>
  );
}
