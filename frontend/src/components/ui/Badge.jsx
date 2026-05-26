const tones = {
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  primary: "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark",
  success: "bg-emerald-50 text-success dark:bg-emerald-500/15",
  warning: "bg-amber-50 text-warning dark:bg-amber-500/15",
  danger: "bg-red-50 text-error dark:bg-red-500/15",
};

const sizes = {
  sm: "px-2 py-1 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({ children, tone = "neutral", size = "sm", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
