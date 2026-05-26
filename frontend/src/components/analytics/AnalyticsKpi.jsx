import { Card } from "../ui/Card";

export function AnalyticsKpi({ label, value, caption, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark",
    success: "bg-emerald-50 text-success dark:bg-emerald-500/15",
    warning: "bg-amber-50 text-warning dark:bg-amber-500/15",
    danger: "bg-red-50 text-error dark:bg-red-500/15",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{caption}</p>
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
