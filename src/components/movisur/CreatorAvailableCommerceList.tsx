import Image from "next/image";
import Link from "next/link";

type Plan = {
  id: string;
  name: string;
  durationMonths: number;
  price: string;
  currency: string;
  isActive: boolean;
};

type CommerceItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  plans: Plan[];
};

type CreatorAvailableCommerceListProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  durationLabel: "meses" | "horas";
  items: CommerceItem[];
};

function formatDuration(value: number, label: "meses" | "horas") {
  if (label === "horas") {
    return `${value} hora${value === 1 ? "" : "s"}`;
  }

  return `${value} mes${value === 1 ? "" : "es"}`;
}

export default function CreatorAvailableCommerceList({
  title,
  description,
  emptyTitle,
  emptyDescription,
  durationLabel,
  items,
}: CreatorAvailableCommerceListProps) {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <Link
          href="/creador"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
        >
          Volver al resumen
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-50 text-xl font-bold text-gray-900 dark:bg-gray-900 dark:text-white">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  ) : (
                    item.name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {item.description || "Disponible para creadores Movisur."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {item.plans.length > 0 ? (
                  item.plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {plan.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDuration(plan.durationMonths, durationLabel)}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {plan.currency} {plan.price}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aun no tiene planes configurados.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {emptyTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {emptyDescription}
          </p>
        </div>
      )}
    </div>
  );
}
