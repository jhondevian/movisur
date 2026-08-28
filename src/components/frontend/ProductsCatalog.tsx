"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type ProductCategory = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type ProductItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string;
  categoryImageUrl: string | null;
  fileType: string;
  isForSale: boolean;
};

type CommerceItem = {
  id: string;
  productUrl: string;
  title: string;
  text: string | null;
  imageUrl: string | null;
  price: string;
  currency: string;
};

type CommerceSection = {
  title: string;
  type: string;
  items: CommerceItem[];
};

type ProductsCatalogProps = {
  categories: ProductCategory[];
  commerceSections?: CommerceSection[];
  hasConfirmedPurchase: boolean;
  initialCategoryId?: string;
  initialSearchTerm?: string;
  initialType?: string;
  products: ProductItem[];
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

function ProductCard({
  hasConfirmedPurchase,
  product,
}: {
  hasConfirmedPurchase: boolean;
  product: ProductItem;
}) {
  const imageUrl = product.imageUrl || product.categoryImageUrl;
  const downloadUrl = `/api/movisur/product-files/${product.id}/download`;

  return (
    <article className="flex min-h-[360px] w-full min-w-0 flex-col items-center rounded-[22px] bg-white px-4 py-6 text-center shadow-theme-xs ring-1 ring-gray-100 sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-7.5rem)/6)] dark:bg-gray-950 dark:ring-gray-800">
      <Link
        href={`/productos/${product.slug}`}
        className="flex min-h-[84px] w-full max-w-[180px] items-start justify-center text-xl font-bold leading-snug text-gray-950 transition hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
      >
        <span className="line-clamp-3 break-words">{product.name}</span>
      </Link>

      <Link
        href={`/productos/${product.slug}`}
        className="relative mt-4 flex h-24 w-full max-w-[180px] items-center justify-center"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
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

      {product.description ? (
        <div className="mt-6 min-h-[96px] w-full max-w-[180px]">
          <p className="line-clamp-4 break-words text-sm leading-6 text-gray-600 dark:text-gray-400">
            {product.description}
          </p>
        </div>
      ) : (
        <div className="min-h-[96px] w-full max-w-[180px]" />
      )}

      <a
        href={
          product.isForSale && !hasConfirmedPurchase
            ? "/informacion?comprar=1"
            : downloadUrl
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

function CommerceCard({ item }: { item: CommerceItem }) {
  return (
    <article className="flex min-h-[320px] w-full min-w-0 flex-col items-center rounded-[22px] bg-white px-4 py-6 text-center shadow-theme-xs ring-1 ring-gray-100 sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-7.5rem)/6)] dark:bg-gray-950 dark:ring-gray-800">
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
  );
}

export default function ProductsCatalog({
  categories,
  commerceSections = [],
  hasConfirmedPurchase,
  initialCategoryId = "todos",
  initialSearchTerm = "",
  initialType,
  products,
}: ProductsCatalogProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialType ||
      (categories.some((category) => category.id === initialCategoryId)
      ? initialCategoryId
      : "todos")
  );
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const selectedCommerceSection = commerceSections.find(
    (section) => section.type === selectedCategoryId
  );
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (selectedCommerceSection) return [];

    const categoryProducts =
      selectedCategoryId === "todos"
        ? products
        : products.filter((product) => product.categoryId === selectedCategoryId);

    if (!query) return categoryProducts;

    return categoryProducts.filter((product) =>
      [
        product.name,
        product.description || "",
        product.categoryName,
        product.fileType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [products, searchTerm, selectedCategoryId, selectedCommerceSection]);
  const filteredCommerceItems = useMemo(() => {
    if (!selectedCommerceSection) return [];

    const query = searchTerm.trim().toLowerCase();
    if (!query) return selectedCommerceSection.items;

    return selectedCommerceSection.items.filter((item) =>
      [item.title, item.text || "", selectedCommerceSection.title]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchTerm, selectedCommerceSection]);

  return (
    <main className="bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <section className="border-b border-gray-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f7f6ff_58%,#eef3ff_100%)] dark:border-gray-900 dark:bg-none dark:bg-gray-950">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 text-center sm:px-6 lg:px-8">
          <h1 className="text-[42px] font-extrabold leading-tight text-gray-950 dark:text-white sm:text-[64px]">
            Productos
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-xl sm:leading-8">
            Explora archivos, herramientas y recursos publicados para Movisur.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("todos")}
              className={`h-11 shrink-0 rounded-lg px-5 text-sm font-semibold transition ${
                selectedCategoryId === "todos"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              Todos
            </button>
            {commerceSections.map((section) => (
              <button
                key={section.type}
                type="button"
                onClick={() => setSelectedCategoryId(section.type)}
                className={`h-11 shrink-0 rounded-lg px-5 text-sm font-semibold transition ${
                  selectedCategoryId === section.type
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {section.title}
              </button>
            ))}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`h-11 shrink-0 rounded-lg px-5 text-sm font-semibold transition ${
                  selectedCategoryId === category.id
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <label className="block w-full md:max-w-sm">
            <span className="sr-only">Buscar productos</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar productos..."
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
        </div>

        {selectedCommerceSection ? (
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {filteredCommerceItems.map((item) => (
              <CommerceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                hasConfirmedPurchase={hasConfirmedPurchase}
                product={product}
              />
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && filteredCommerceItems.length === 0 ? (
          <p className="mt-14 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            No hay productos disponibles con ese filtro.
          </p>
        ) : null}
      </section>
    </main>
  );
}
