type RoleDashboardProps = {
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  actions: string[];
};

export default function RoleDashboard({
  title,
  description,
  stats,
  actions,
}: RoleDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Acciones principales
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {actions.map((action) => (
            <div
              key={action}
              className="rounded-xl bg-gray-50 px-5 py-4 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
