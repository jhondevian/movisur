"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const sectionPreviewLimit = 6;
const mobileSectionPreviewLimit = 3;

type FrontendCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type FrontendProductFile = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  downloadUrl: string;
  categoryId: string | null;
  isForSale: boolean;
  fileType: string;
  category: {
    name: string;
    imageUrl: string | null;
  } | null;
};

type CreatorCommerceItem = {
  id: string;
  productUrl: string;
  title: string;
  text: string | null;
  imageUrl: string | null;
  price: string;
  currency: string;
};

type CreatorCommerceSection = {
  title: string;
  items: CreatorCommerceItem[];
};

type FrontendProductCard = {
  id: string;
  productUrl: string;
  title: string;
  text: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string;
  downloadUrl: string;
  isForSale: boolean;
  fileType: string;
};

function FileFallbackIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-14 w-14 text-brand-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

type FrontendBodyProps = {
  brandCategories: FrontendCategory[];
  creatorCommerceSections: CreatorCommerceSection[];
  downloadRetryAfter?: string;
  downloadStatus?: string;
  fileCategories: FrontendCategory[];
  hasConfirmedPurchase: boolean;
  productFiles: FrontendProductFile[];
};

function ProductCard({
  hasConfirmedPurchase,
  hideOnMobile = false,
  product,
}: {
  hasConfirmedPurchase: boolean;
  hideOnMobile?: boolean;
  product: FrontendProductCard;
}) {
  return (
    <article
      className={`min-h-[360px] w-full min-w-0 flex-col items-center rounded-[22px] bg-white px-4 py-6 text-center sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-7.5rem)/6)] dark:bg-gray-950 ${
        hideOnMobile ? "hidden sm:flex" : "flex"
      }`}
    >
      <Link
        href={product.productUrl}
        className="flex min-h-[84px] w-full max-w-[180px] items-start justify-center text-xl font-bold leading-snug text-gray-950 transition hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
      >
        <span className="line-clamp-3 break-words">{product.title}</span>
      </Link>

      <Link
        href={product.productUrl}
        className="relative mt-4 flex h-24 w-full max-w-[180px] items-center justify-center"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="180px"
            className="object-contain transition duration-200 hover:scale-105"
          />
        ) : (
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
            <FileFallbackIcon />
          </span>
        )}
      </Link>

      {product.text ? (
        <div className="mt-6 min-h-[96px] w-full max-w-[180px]">
          <p className="line-clamp-4 break-words text-sm leading-6 text-gray-600 dark:text-gray-400">
            {product.text}{" "}
            <button
              type="button"
              className="inline text-xs font-medium text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
            >
              Ver mas
            </button>
          </p>
        </div>
      ) : (
        <div className="min-h-[96px] w-full max-w-[180px]" />
      )}

      <a
        href={
          product.isForSale && !hasConfirmedPurchase
            ? "/informacion?comprar=1"
            : product.downloadUrl
        }
        target={
          product.fileType === "url" &&
          (!product.isForSale || hasConfirmedPurchase)
            ? "_blank"
            : undefined
        }
        rel={
          product.fileType === "url" &&
          (!product.isForSale || hasConfirmedPurchase)
            ? "noopener noreferrer"
            : undefined
        }
        className="mt-auto flex w-full items-center justify-center rounded-lg bg-brand-500 px-5 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
      >
        {product.isForSale && !hasConfirmedPurchase
          ? "Comprar"
          : product.fileType === "video"
          ? "Ver video"
          : "Descargar"}
      </a>
    </article>
  );
}

function SectionTitle({
  href,
  showMore,
  title,
}: {
  href: string;
  showMore: boolean;
  title: string;
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <h2 className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white">
        {title}
      </h2>
      {showMore ? (
        <Link
          href={href}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          aria-label={`Ver mas ${title}`}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}

export default function FrontendBody({
  brandCategories,
  creatorCommerceSections,
  downloadRetryAfter,
  downloadStatus,
  fileCategories,
  hasConfirmedPurchase,
  productFiles,
}: FrontendBodyProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const availableCategories = fileCategories.map((category) => ({
    id: category.id,
    name: category.name,
    imageUrl: category.imageUrl,
  }));
  const frontendCategoryIds = new Set(
    availableCategories.map((category) => category.id)
  );
  const frontendProducts = productFiles.map((file) => ({
    id: file.id,
    productUrl: `/productos/${file.slug}`,
    title: file.name,
    text: file.description,
    imageUrl: file.imageUrl || file.category?.imageUrl || null,
    categoryId: file.categoryId,
    categoryName: file.category?.name || "",
    downloadUrl: `/api/movisur/product-files/${file.id}/download`,
    isForSale: file.isForSale,
    fileType: file.fileType,
  }));
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const categoryFiltered =
      selectedCategoryId === "todos"
        ? frontendProducts.filter(
            (product) =>
              !product.categoryId || !frontendCategoryIds.has(product.categoryId)
          )
        : frontendProducts.filter(
            (product) => product.categoryId === selectedCategoryId
          );

    if (!normalizedSearch) return categoryFiltered;

    return categoryFiltered.filter((product) =>
      [product.title, product.text || "", product.categoryName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [frontendCategoryIds, frontendProducts, searchTerm, selectedCategoryId]);
  const frontendCategorySections = availableCategories
    .map((category) => ({
      ...category,
      products: frontendProducts.filter(
        (product) => product.categoryId === category.id
      ),
    }))
    .filter((section) => section.products.length > 0);
  const visibleGeneralProducts =
    selectedCategoryId === "todos"
      ? filteredProducts.slice(0, sectionPreviewLimit)
      : filteredProducts;
  const alquilerSections = creatorCommerceSections.filter(
    (section) =>
      section.items.length > 0 &&
      section.title.toLowerCase().startsWith("alquiler")
  );
  const alquilerMoreHref = "/productos?tipo=alquiler";
  const hasAlquilerMore = alquilerSections.some(
    (section) => section.items.length > sectionPreviewLimit
  );
  const otherCommerceSections = creatorCommerceSections.filter(
    (section) =>
      section.items.length > 0 &&
      !section.title.toLowerCase().startsWith("alquiler")
  );
  const heroCategories = brandCategories.slice(0, 6);
  const downloadMessage =
    downloadStatus === "empty"
      ? "Aún no hay una versión pública de Movisur Tool disponible. El admin debe subir y activar el archivo."
      : downloadStatus === "blocked"
      ? `Hay muchos intentos de descarga. Intenta nuevamente en ${Math.max(
          1,
          Math.ceil(Number(downloadRetryAfter || 0) / 60)
        )} min.`
      : downloadStatus === "forbidden"
      ? "La descarga debe iniciarse desde Movisur. Vuelve a presionar el botón de descarga."
      : "";

  return (
    <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <section
        id="descargar"
        className="relative overflow-hidden border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-12 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
          <h1 className="max-w-5xl text-[42px] font-extrabold leading-[1.04] text-gray-950 dark:text-white sm:text-[64px] lg:text-[72px]">
            Movisur Tool
          </h1>

          <p className="mt-6 max-w-5xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-xl sm:leading-8">
            Instala la herramienta Movisur, comparte archivos y accede a
            versiones compatibles para tus dispositivos principales desde una
            experiencia clara y ordenada.
          </p>

          {heroCategories.length > 0 ? (
          <div className="mt-7 grid w-full max-w-[340px] grid-cols-6 items-end justify-center gap-2 sm:mt-9 sm:max-w-3xl sm:flex sm:flex-wrap sm:gap-x-10 sm:gap-y-6">
            {heroCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(category.id);
                  setIsFilterOpen(false);
                  document
                    .getElementById("operaciones")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex min-w-0 flex-col items-center gap-1.5 text-center transition hover:-translate-y-0.5 sm:w-24 sm:gap-3"
              >
                <div className="relative flex h-8 w-8 items-center justify-center sm:h-16 sm:w-20">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 32px, 80px"
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-xs font-extrabold text-gray-950 dark:text-white sm:text-xl">
                      {category.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="line-clamp-1 max-w-full text-[10px] font-bold leading-tight text-gray-950 dark:text-white sm:text-sm">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          ) : null}

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="/api/movisur/download"
              className="rounded-lg bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
            >
              Descargar
            </a>
            <Link
              href="/informacion"
              className="rounded-lg border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-white/5"
            >
              Informacion
            </Link>
          </div>

          {downloadMessage ? (
            <p className="mt-5 max-w-xl rounded-lg border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-500 shadow-theme-xs dark:border-brand-500/20 dark:bg-gray-900">
              {downloadMessage}
            </p>
          ) : null}

        </div>
      </section>

      <section
        id="operaciones"
        className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              {alquilerSections.length > 0 ? (
                <>
                  <Link
                    href={alquilerMoreHref}
                    className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
                  >
                    Alquiler
                  </Link>
                  {hasAlquilerMore ? (
                    <Link
                      href={alquilerMoreHref}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                      aria-label="Ver mas alquileres"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 12h14m-6-6 6 6-6 6"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </Link>
                  ) : null}
                </>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <div className="flex min-w-0 items-center justify-end gap-2">
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isSearchOpen
                      ? "w-[160px] opacity-100 sm:w-[240px]"
                      : "w-0 opacity-0"
                  }`}
                >
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen((current) => !current)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                  aria-label="Buscar productos"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterOpen((current) => !current)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:hover:bg-white/5"
              >
                {isFilterOpen ? "Ocultar filtros" : "Filtrar"}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              isFilterOpen ? "max-h-36 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mt-6 overflow-x-auto pb-2">
              <div className="mx-auto flex w-max min-w-full snap-x justify-center gap-6">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setIsFilterOpen(false);
                    }}
                    className="flex w-20 shrink-0 snap-start flex-col items-center gap-3 text-center transition hover:-translate-y-0.5 sm:w-24"
                  >
                    <div className="relative flex h-14 w-16 items-center justify-center sm:h-16 sm:w-20">
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          sizes="80px"
                          className="object-contain"
                        />
                      ) : (
                        <span className="text-xl font-extrabold text-gray-950 dark:text-white">
                          {category.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span
                      className={`line-clamp-1 text-sm font-bold ${
                        selectedCategoryId === category.id
                          ? "text-brand-500"
                          : "text-gray-950 dark:text-white"
                      }`}
                    >
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedCategoryId !== "todos" ? (
          <>
            <div className="mb-8 flex justify-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Categoria:{" "}
                {availableCategories.find(
                  (category) => category.id === selectedCategoryId
                )?.name || "Seleccionada"}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {visibleGeneralProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  hasConfirmedPurchase={hasConfirmedPurchase}
                  product={product}
                />
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <p className="mt-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                No hay archivos disponibles en esta seccion.
              </p>
            ) : null}
          </>
        ) : null}

        {selectedCategoryId === "todos"
          ? alquilerSections
              .map((section) => (
                <div key={section.title} className="mt-16 first:mt-0">
                  <div className="flex flex-wrap justify-center gap-6">
                    {section.items.slice(0, sectionPreviewLimit).map((item, index) => (
                      <article
                        key={item.id}
                        className={`min-h-[320px] w-full min-w-0 flex-col items-center rounded-[22px] bg-white px-4 py-6 text-center sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-7.5rem)/6)] dark:bg-gray-950 ${
                          index >= mobileSectionPreviewLimit
                            ? "hidden sm:flex"
                            : "flex"
                        }`}
                      >
                        <Link
                          href={item.productUrl}
                          className="flex min-h-14 items-start justify-center text-xl font-bold leading-snug text-gray-950 transition hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
                        >
                          {item.title}
                        </Link>

                        <Link
                          href={item.productUrl}
                          className="relative mt-5 flex h-24 w-full items-center justify-center"
                        >
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="180px"
                              className="object-contain transition duration-200 hover:scale-105"
                            />
                          ) : (
                            <span className="text-3xl font-extrabold text-gray-950 dark:text-white">
                              {item.title.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </Link>

                        <div className="mt-8 text-center">
                          <p className="text-lg font-extrabold text-gray-950 dark:text-white">
                            {item.currency} {item.price}
                          </p>
                        </div>

                        <Link
                          href={item.productUrl}
                          className="mt-auto flex w-full items-center justify-center rounded-lg bg-brand-500 px-5 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
                        >
                          Vendedores
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              ))
          : null}

        {selectedCategoryId === "todos"
          ? frontendCategorySections.map((section) => (
              <div key={section.id} className="mt-16">
                <SectionTitle
                  href={`/productos?categoria=${section.id}`}
                  showMore={section.products.length > sectionPreviewLimit}
                  title={section.name}
                />
                <div className="flex flex-wrap justify-center gap-6">
                  {section.products
                    .slice(0, sectionPreviewLimit)
                    .map((product, index) => (
                      <ProductCard
                        key={product.id}
                        hasConfirmedPurchase={hasConfirmedPurchase}
                        hideOnMobile={index >= mobileSectionPreviewLimit}
                        product={product}
                      />
                    ))}
                </div>
              </div>
            ))
          : null}

        {selectedCategoryId === "todos"
          ? otherCommerceSections
          .map((section) => (
            <div key={section.title} className="mt-16">
              <SectionTitle
                href="/productos"
                showMore={section.items.length > sectionPreviewLimit}
                title={section.title}
              />

              <div className="flex flex-wrap justify-center gap-6">
                {section.items.slice(0, sectionPreviewLimit).map((item, index) => (
                  <article
                    key={item.id}
                    className={`min-h-[320px] w-full min-w-0 flex-col items-center rounded-[22px] bg-white px-4 py-6 text-center sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-7.5rem)/6)] dark:bg-gray-950 ${
                      index >= mobileSectionPreviewLimit ? "hidden sm:flex" : "flex"
                    }`}
                  >
                    <Link
                      href={item.productUrl}
                      className="flex min-h-14 items-start justify-center text-xl font-bold leading-snug text-gray-950 transition hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
                    >
                      {item.title}
                    </Link>

                    <Link
                      href={item.productUrl}
                      className="relative mt-5 flex h-24 w-full items-center justify-center"
                    >
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="180px"
                          className="object-contain transition duration-200 hover:scale-105"
                        />
                      ) : (
                        <span className="text-3xl font-extrabold text-gray-950 dark:text-white">
                          {item.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </Link>

                    <div className="mt-8 text-center">
                      <p className="text-lg font-extrabold text-gray-950 dark:text-white">
                        {item.currency} {item.price}
                      </p>
                    </div>

                    <Link
                      href={item.productUrl}
                      className="mt-auto flex w-full items-center justify-center rounded-lg bg-brand-500 px-5 py-4 text-base font-semibold text-white shadow-theme-md transition hover:bg-brand-600"
                    >
                      Vendedores
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ))
          : null}

        {selectedCategoryId === "todos" ? (
          <div className="mt-16">
            <SectionTitle
              href="/productos"
              showMore={filteredProducts.length > sectionPreviewLimit}
              title="Archivos"
            />
            <div className="flex flex-wrap justify-center gap-6">
              {visibleGeneralProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  hasConfirmedPurchase={hasConfirmedPurchase}
                  hideOnMobile={index >= mobileSectionPreviewLimit}
                  product={product}
                />
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <p className="mt-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                No hay archivos disponibles en esta seccion.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
