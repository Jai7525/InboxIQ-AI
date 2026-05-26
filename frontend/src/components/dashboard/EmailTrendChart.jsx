import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "../ui/Card";
import { ChartSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{payload[0].value} emails</p>
    </div>
  );
}

export function EmailTrendChart({ data, loading = false, error = "" }) {
  return (
    <Card className="overflow-hidden p-5">
      <CardHeader title="Email Trend" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Week</span>} />
      {error ? (
        <StateMessage type="error" title="Trend unavailable" description={error} className="mt-5" />
      ) : loading ? (
        <ChartSkeleton className="mt-5" />
      ) : data.length === 0 ? (
        <StateMessage type="empty" title="No trend data" description="Email trend will appear after emails are synced." className="mt-5" />
      ) : (
      <div className="mt-5 h-56 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-950/25">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 6, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="emailTrend" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.34} />
                <stop offset="55%" stopColor="#6366F1" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis axisLine={false} tickLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip cursor={{ stroke: "#93C5FD", strokeWidth: 1, strokeDasharray: "4 4" }} content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="emails"
              stroke="#60A5FA"
              strokeWidth={3}
              fill="url(#emailTrend)"
              dot={{ r: 3, strokeWidth: 2, fill: "#0F172A", stroke: "#60A5FA" }}
              activeDot={{ r: 6, strokeWidth: 3, fill: "#2563EB", stroke: "#DBEAFE" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </Card>
  );
}
