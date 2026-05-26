import { Card } from "../ui/Card";

export function KpiCard({ label, value, caption, icon: Icon, tone = "primary" }) {
  const tones = {
    primary: "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark",
    success: "bg-emerald-50 text-success dark:bg-emerald-500/15",
    warning: "bg-amber-50 text-warning dark:bg-amber-500/15",
    danger: "bg-red-50 text-error dark:bg-red-500/15",
    violet: "bg-violet-50 text-secondary dark:bg-violet-500/15",
  };

  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
