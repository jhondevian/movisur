export default function FrontendFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white dark:border-gray-900 dark:bg-gray-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-base font-medium text-gray-500 dark:text-gray-400">
          <span>© 2026 Movisur Tool - Todos los derechos reservados.</span>
          <span className="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 sm:block" />
          <span>
            Un producto de{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              Movisur
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
