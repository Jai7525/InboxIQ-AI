import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "../ui/Card";
import { ChartSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const values = payload.reduce((acc, item) => ({ ...acc, [item.dataKey]: item.value }), {});

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-white/10 dark:bg-slate-950">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-2 space-y-1 text-sm font-bold">
        <p className="text-slate-950 dark:text-white">{values.emails || 0} emails</p>
        <p className="text-amber-600 dark:text-amber-300">{values.urgent || 0} urgent</p>
        <p className="text-rose-600 dark:text-rose-300">{values.threats || 0} threats</p>
      </div>
    </div>
  );
}

export function EmailTrendChart({ data, loading = false, error = "" }) {
  return (
    <Card className="overflow-hidden p-5">
      <CardHeader title="Emails Over Time" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Week</span>} />
      {error ? (
        <StateMessage type="error" title="Trend unavailable" description={error} className="mt-5" />
      ) : loading ? (
        <ChartSkeleton className="mt-5" />
      ) : data.length === 0 ? (
        <StateMessage type="empty" title="No trend data" description="Sync emails to generate the timeline." className="mt-5" />
      ) : (
        <div className="mt-5 h-80 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-950/25">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -12, right: 12, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsEmailTrend" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.34} />
                  <stop offset="55%" stopColor="#6366F1" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analyticsThreatTrend" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={12} tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} tick={{ fontSize: 11, fill: "#64748B" }} />
              <Tooltip cursor={{ stroke: "#93C5FD", strokeWidth: 1, strokeDasharray: "4 4" }} content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="threats"
                stroke="#FB7185"
                strokeWidth={2}
                fill="url(#analyticsThreatTrend)"
                dot={{ r: 2, strokeWidth: 2, fill: "#0F172A", stroke: "#FB7185" }}
                activeDot={{ r: 5, strokeWidth: 3, fill: "#E11D48", stroke: "#FFE4E6" }}
              />
              <Area
                type="monotone"
                dataKey="urgent"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 3, fill: "#D97706", stroke: "#FEF3C7" }}
              />
              <Area
                type="monotone"
                dataKey="emails"
                stroke="#60A5FA"
                strokeWidth={3}
                fill="url(#analyticsEmailTrend)"
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
