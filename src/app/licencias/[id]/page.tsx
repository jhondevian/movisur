import CreatorCommerceBuyBox from "@/components/frontend/CreatorCommerceBuyBox";
import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, cleanSeoText, getShareImage, siteUrl } from "@/lib/site-metadata";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type LicensePageProps = {
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
}: LicensePageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.creatorLicenseProduct.findFirst({
    where: { id, isActive: true },
    select: { name: true, description: true, imageUrl: true },
  });

  const title = product ? `${product.name} | Movisur` : "Licencia | Movisur";
  const description = product?.description || "Licencia disponible en Movisur";
  const image = getShareImage(product?.imageUrl);

  return {
    title,
    description: cleanSeoText(description, "Licencia disponible en Movisur"),
    alternates: {
      canonical: `${siteUrl}/licencias/${id}`,
    },
    openGraph: {
      title: product?.name || "Licencia Movisur",
      description: cleanSeoText(description, "Licencia disponible en Movisur"),
      url: `${siteUrl}/licencias/${id}`,
      images: [
        {
          url: absoluteUrl(image),
          alt: product?.name || "Licencia Movisur",
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.name || "Licencia Movisur",
      description: cleanSeoText(description, "Licencia disponible en Movisur"),
      images: [absoluteUrl(image)],
    },
  };
}

export default async function LicensePage({ params }: LicensePageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const availableAccountWhere = {
    isActive: true,
    OR: [{ assignedToId: null }, { assignedExpiresAt: { lt: new Date() } }],
  };
  const product = await prisma.creatorLicenseProduct.findFirst({
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

  if (!product || product.offers.length === 0) notFound();
  const lowestOffer = product.offers[0];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanSeoText(product.description, "Licencia disponible en Movisur"),
    image: product.imageUrl ? absoluteUrl(product.imageUrl) : undefined,
    url: `${siteUrl}/licencias/${product.id}`,
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
          url: `${siteUrl}/licencias/${product.id}`,
        }
      : undefined,
  };

  const creatorIds = Array.from(
    new Set(product.offers.map((offer) => offer.creatorId))
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
    <>
      <FrontendHeader />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <section className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-14 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
            <Link
              href="/#operaciones"
              className="text-sm font-semibold text-brand-500 transition hover:text-brand-600"
            >
              Volver a productos
            </Link>
            <h1 className="mx-auto mt-5 max-w-5xl text-[42px] font-extrabold leading-[1.04] text-gray-950 dark:text-white sm:text-[64px] lg:text-[72px]">
              {product.name}
            </h1>
            {product.description ? (
              <p className="mx-auto mt-6 max-w-4xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-xl sm:leading-8">
                {product.description}
              </p>
            ) : null}
            <div className="relative mt-9 flex h-56 w-full max-w-xl items-center justify-center sm:h-72">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-contain"
                  priority
                />
              ) : (
                <span className="text-5xl font-extrabold text-gray-950 dark:text-white">
                  {product.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </section>

        <CreatorCommerceBuyBox
          nextPath={`/licencias/${product.id}`}
          offers={product.offers.map((offer) => ({
            id: offer.id,
            creatorId: offer.creatorId,
            commerceType: "license",
            sellerName: `${offer.creator.firstName} ${offer.creator.lastName}`.trim(),
            sellerAvatarUrl: offer.creator.avatarUrl,
            planName: offer.plan.name,
            durationLabel: `${offer.plan.durationMonths} mes${
              offer.plan.durationMonths === 1 ? "" : "es"
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
    </>
  );
}
