import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColors } from "../../utils/constants";
import { Card, CardHeader } from "../ui/Card";

export function CategoryChart({ data }) {
  return (
    <Card className="p-5">
      <CardHeader title="Email Categories" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Week</span>} />
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
    </Card>
  );
}

export function TrendChart({ data }) {
  return (
    <Card className="p-5">
      <CardHeader title="Email Trend" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Week</span>} />
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 6, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="emailTrend" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
            <Tooltip />
            <Area type="monotone" dataKey="emails" stroke="#6366F1" strokeWidth={3} fill="url(#emailTrend)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
