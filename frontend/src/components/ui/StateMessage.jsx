import { AlertCircle, Inbox, Loader2 } from "lucide-react";

const stateStyles = {
  empty: {
    icon: Inbox,
    className: "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200",
  },
  loading: {
    icon: Loader2,
    className: "border-indigo-100 bg-indigo-50/70 text-slate-500 dark:border-sky-500/15 dark:bg-sky-500/10 dark:text-slate-300",
  },
};

export function StateMessage({ type = "empty", title, description, className = "" }) {
  const state = stateStyles[type] || stateStyles.empty;
  const Icon = state.icon;

  return (
    <div className={`rounded-xl border px-4 py-5 text-center ${state.className} ${className}`}>
      <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
        <Icon size={18} className={type === "loading" ? "animate-spin" : ""} />
      </div>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-xs leading-5 opacity-80">{description}</p> : null}
    </div>
  );
}
