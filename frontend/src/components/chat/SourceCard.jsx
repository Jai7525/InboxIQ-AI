import { SenderIcon } from "../ui/SenderIcon";

export function SourceCard({ source }) {
  return (
    <button type="button" className="subtle-panel flex items-start gap-3 p-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
      <SenderIcon sender={source.sender || source.meta} name={source.senderName || source.title} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{source.title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{source.meta}</p>
      </div>
    </button>
  );
}
