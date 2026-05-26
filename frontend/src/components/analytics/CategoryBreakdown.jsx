import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColors } from "../../utils/constants";
import { Card, CardHeader } from "../ui/Card";
import { ChartSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = item.payload?.total || 0;
  const percent = total ? Math.round((item.value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.name}</p>
      <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
        {item.value} emails · {percent}%
      </p>
    </div>
  );
}

export function CategoryBreakdown({ categories, loading = false, error = "" }) {
  const total = categories.reduce((sum, item) => sum + item.value, 0);
  const chartCategories = categories.map((item) => ({ ...item, total }));

  return (
    <Card className="flex h-full flex-col p-5">
      <CardHeader title="Email Categories" />
      {error ? (
        <StateMessage type="error" title="Categories unavailable" description={error} className="mt-5" />
      ) : loading ? (
        <ChartSkeleton className="mt-5" />
      ) : categories.length === 0 ? (
        <StateMessage type="empty" title="No categories yet" description="Categories will appear after emails are processed." className="mt-5" />
      ) : (
        <div className="mt-4 grid flex-1 items-center gap-5 lg:grid-cols-[minmax(140px,180px)_minmax(0,1fr)]">
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartCategories} dataKey="value" innerRadius={46} outerRadius={76} paddingAngle={2}>
                  {chartCategories.map((entry, index) => (
                    <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-950 dark:text-white">{total}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>
          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">
            {categories.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: categoryColors[index % categoryColors.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{total ? Math.round((item.value / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
