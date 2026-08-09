import FrontendFooter from "@/components/frontend/FrontendFooter";
import FrontendHeader from "@/components/frontend/FrontendHeader";
import ProductContentTabs from "@/components/frontend/ProductContentTabs";
import ProductRating from "@/components/frontend/ProductRating";
import { authCookieName, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, cleanSeoText, getShareImage, siteUrl } from "@/lib/site-metadata";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "Archivo remoto";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileTypeLabel(fileType: string) {
  if (fileType === "video") return "Video";
  if (fileType === "file") return "Archivo";
  if (fileType === "zip") return "ZIP";
  return "URL";
}

async function getAuthContext(productFileId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return {
      isLoggedIn: false,
      hasConfirmedPurchase: false,
      hasDownloaded: false,
      userRating: 0,
    };
  }

  try {
    const user = await verifyAuthToken(token);
    const [purchase, review, download] = await Promise.all([
      prisma.adminNotification.findFirst({
        where: {
          type: "binance_payment_confirmation",
          metadata: {
            contains: `"userId":"${user.id}"`,
          },
          AND: [
            {
              metadata: {
                contains: `"purchaseStatus":"confirmed"`,
              },
            },
          ],
        },
        select: { id: true },
      }),
      prisma.movisurProductFileReview.findUnique({
        where: {
          productFileId_userId: {
            productFileId,
            userId: user.id,
          },
        },
        select: {
          rating: true,
        },
      }),
      prisma.movisurProductFileDownload.findUnique({
        where: {
          productFileId_userId: {
            productFileId,
            userId: user.id,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    return {
      isLoggedIn: true,
      hasConfirmedPurchase: Boolean(purchase),
      hasDownloaded: Boolean(download),
      userRating: review?.rating ?? 0,
    };
  } catch {
    return {
      isLoggedIn: false,
      hasConfirmedPurchase: false,
      hasDownloaded: false,
      userRating: 0,
    };
  }
}

async function getProductRatingSummary(productFileId: string) {
  const [aggregate, count] = await Promise.all([
    prisma.movisurProductFileReview.aggregate({
      where: { productFileId },
      _avg: { rating: true },
    }),
    prisma.movisurProductFileReview.count({
      where: { productFileId },
    }),
  ]);

  return {
    average: aggregate._avg.rating ?? 0,
    count,
  };
}
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.movisurProductFile.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: {
      name: true,
      description: true,
      imageUrl: true,
      category: {
        select: {
          imageUrl: true,
        },
      },
    },
  });

  if (!product) {
    return {
      title: "Producto | Movisur",
    };
  }

  const description = product.description || "Producto descargable de Movisur";
  const image = getShareImage(product.imageUrl || product.category?.imageUrl);

  return {
    title: `${product.name} | Movisur`,
    description: cleanSeoText(
      description,
      `${product.name} disponible en Movisur Tool para descarga, soporte y recursos técnicos.`
    ),
    alternates: {
      canonical: `${siteUrl}/productos/${slug}`,
    },
    openGraph: {
      title: product.name,
      description: cleanSeoText(description, "Producto descargable de Movisur"),
      url: `${siteUrl}/productos/${slug}`,
      images: [
        {
          url: absoluteUrl(image),
          alt: product.name,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: cleanSeoText(description, "Producto descargable de Movisur"),
      images: [absoluteUrl(image)],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.movisurProductFile.findFirst({
    where: {
      slug,
      isActive: true,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      revisions: {
        orderBy: { versionNumber: "desc" },
        take: 4,
      },
    },
  });

  if (!product) notFound();

  const [authContext, ratingSummary] = await Promise.all([
    getAuthContext(product.id),
    getProductRatingSummary(product.id),
  ]);
  const canAccess = product.isForSale
    ? authContext.hasConfirmedPurchase
    : authContext.isLoggedIn;
  const actionHref = canAccess
    ? `/api/movisur/product-files/${product.id}/download`
    : product.isForSale
    ? "/informacion?comprar=1"
    : `/signin?next=${encodeURIComponent(`/productos/${product.slug}`)}`;
  const actionLabel = canAccess
    ? product.fileType === "video"
      ? "Ver video"
      : "Descargar"
    : product.isForSale
    ? "Comprar"
    : "Iniciar sesion";
  const imageUrl = product.imageUrl || product.category?.imageUrl || null;
  const freePreviousRevisionId = product.revisions.find(
    (revision) => !revision.isCurrent
  )?.id;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: cleanSeoText(
      product.description,
      `${product.name} disponible en Movisur Tool.`
    ),
    image: imageUrl ? absoluteUrl(imageUrl) : undefined,
    url: `${siteUrl}/productos/${product.slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Android",
    aggregateRating:
      ratingSummary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average.toFixed(1),
            ratingCount: ratingSummary.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: product.isForSale ? "0" : "0",
      priceCurrency: "USD",
      url: `${siteUrl}/productos/${product.slug}`,
    },
  };

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
              {imageUrl ? (
                <Image
                  src={imageUrl}
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

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href={actionHref}
                className="rounded-lg bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
              >
                {actionLabel}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-5 sm:gap-7">
              {[
                { label: "Tipo", value: getFileTypeLabel(product.fileType) },
                { label: "Tamano", value: formatSize(product.fileSize) },
                { label: "Categoria", value: product.category?.name || "-" },
                { label: "Acceso", value: product.isForSale ? "Venta" : "Libre" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <span className="flex h-14 min-w-14 items-center justify-center rounded-full bg-white px-4 text-sm font-bold text-gray-950 shadow-theme-lg ring-1 ring-gray-100 dark:bg-gray-900 dark:text-white dark:ring-gray-800 sm:h-16">
                    {item.value}
                  </span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <ProductRating
              productFileId={product.id}
              isLoggedIn={authContext.isLoggedIn}
              canRate={authContext.hasDownloaded}
              initialAverage={ratingSummary.average}
              initialCount={ratingSummary.count}
              initialUserRating={authContext.userRating}
            />
          </div>
        </section>

        <ProductContentTabs
          description={
            product.description ||
            "Producto Movisur configurado desde el panel para descarga directa."
          }
          actionHref={actionHref}
          actionLabel={actionLabel}
          canAccess={canAccess}
          requiresPurchase={product.isForSale}
          revisions={product.revisions.map((revision) => ({
            id: revision.id,
            versionNumber: revision.versionNumber,
            fileType: getFileTypeLabel(revision.fileType),
            fileSize: formatSize(revision.fileSize),
            isCurrent: revision.isCurrent,
            uploadedAt: revision.createdAt.toISOString(),
            downloadHref:
              product.isForSale
                ? authContext.hasConfirmedPurchase
                  ? `/api/movisur/product-files/${product.id}/revisions/${revision.id}/download`
                  : "/informacion?comprar=1"
                : authContext.hasConfirmedPurchase ||
                  (authContext.isLoggedIn &&
                    (revision.isCurrent ||
                      revision.id === freePreviousRevisionId))
                ? `/api/movisur/product-files/${product.id}/revisions/${revision.id}/download`
                : revision.isCurrent || revision.id === freePreviousRevisionId
                ? `/signin?next=${encodeURIComponent(`/productos/${product.slug}`)}`
                : "/informacion?comprar=1",
            canDownload:
              product.isForSale
                ? authContext.hasConfirmedPurchase
                : authContext.hasConfirmedPurchase ||
                  (authContext.isLoggedIn &&
                    (revision.isCurrent ||
                      revision.id === freePreviousRevisionId)),
          }))}
        />
      </main>
      <FrontendFooter />
    </>
  );
}
