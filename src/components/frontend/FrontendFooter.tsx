const footerBrands = ["Samsung", "LG", "Xiaomi", "Honor", "Motorola", "Huawei"];

export default function FrontendFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:px-8">
        <p className="text-base font-medium text-gray-500 dark:text-gray-400">
          Movisur Tool disponible para
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {footerBrands.map((brand) => (
            <div
              key={brand}
              className="flex items-center gap-3 text-base font-medium text-gray-600 dark:text-gray-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-500 dark:bg-brand-500/10">
                {brand.slice(0, 2)}
              </span>
              {brand}
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-base font-medium text-gray-500 dark:text-gray-400">
          <span>© 2026 Movisur Tool - All Rights Reserved.</span>
          <span className="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 sm:block" />
          <span>
            A product by{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              Movisur
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
