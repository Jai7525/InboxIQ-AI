import { Star } from "lucide-react";
import { Badge } from "../ui/Badge";
import { SenderIcon } from "../ui/SenderIcon";

export function EmailListItem({ email, selected = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-4 p-5 text-left transition-all duration-200 ease-out ${
        selected
          ? "bg-indigo-50/70 dark:bg-sky-500/10"
          : "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] dark:hover:bg-white/[0.055] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.24)]"
      }`}
    >
      <SenderIcon sender={email.address || email.from} name={email.from} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{email.from}</p>
          {email.starred ? <Star size={14} className="shrink-0 fill-warning text-warning" /> : null}
        </div>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email.address}</p>
        <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{email.subject}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email.preview}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-500 dark:text-slate-400">{email.time}</p>
        {email.tone !== "neutral" ? <Badge tone={email.tone}>{email.label}</Badge> : null}
      </div>
    </button>
  );
}
