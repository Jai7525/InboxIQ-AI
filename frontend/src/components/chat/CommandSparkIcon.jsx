import { Sparkles } from "lucide-react";

export function CommandSparkIcon({ className = "", iconSize = 17 }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-indigo-200 bg-white text-primary-light shadow-sm ring-1 ring-indigo-100 dark:border-cyan-300/20 dark:bg-slate-950 dark:text-cyan-200 dark:ring-indigo-400/10 dark:shadow-[0_10px_28px_rgba(34,211,238,0.10)] ${className}`}
      aria-label="AI assistant"
      role="img"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(99,102,241,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] dark:bg-[radial-gradient(circle_at_30%_18%,rgba(34,211,238,0.24),transparent_34%),linear-gradient(135deg,rgba(30,41,89,0.95),rgba(2,6,23,0.98))]" />
      <span className="absolute inset-[5px] rounded-lg border border-indigo-100/80 dark:border-white/10" />
      <Sparkles size={iconSize} className="relative drop-shadow-[0_0_8px_rgba(99,102,241,0.28)] dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.55)]" />
    </span>
  );
}
