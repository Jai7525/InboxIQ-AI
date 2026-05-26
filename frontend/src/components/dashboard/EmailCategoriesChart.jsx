import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColors } from "../../utils/constants";
import { Card, CardHeader } from "../ui/Card";
import { ChartSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function EmailCategoriesChart({ data, loading = false, error = "" }) {
  return (
    <Card className="p-5">
      <CardHeader title="Email Categories" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Week</span>} />
      {error ? (
        <StateMessage type="error" title="Categories unavailable" description={error} className="mt-5" />
      ) : loading ? (
        <ChartSkeleton className="mt-5" />
      ) : data.length === 0 ? (
        <StateMessage type="empty" title="No categories yet" description="Categories will appear after emails are processed." className="mt-5" />
      ) : (
      <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: categoryColors[index % categoryColors.length] }} />
                {item.name}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </Card>
  );
}
