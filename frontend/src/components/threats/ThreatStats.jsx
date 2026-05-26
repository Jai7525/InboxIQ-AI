import { Card } from "../ui/Card";

const toneStyles = {
  danger: "border-red-500/15 bg-red-500/10 text-red-500 dark:bg-red-500/10 dark:text-red-300",
  warning: "border-amber-500/15 bg-amber-500/10 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300",
  success: "border-emerald-500/15 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function ThreatStats({ metrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className={`p-5 ${toneStyles[metric.tone] || ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="mt-2 text-3xl font-bold">{metric.value}</p>
                <p className="text-xs opacity-80">{metric.caption}</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 dark:bg-white/10">
                <Icon size={14} />
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
