import { Badge } from "../ui/Badge";
import { SenderIcon } from "../ui/SenderIcon";

export function SearchResultItem({ result, selected = false, onSelect }) {
  const tone = result.matchScore >= 90 ? "success" : "warning";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 p-5 text-left transition ${
        selected ? "bg-indigo-50/70 dark:bg-sky-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <SenderIcon sender={result.sender} name={result.senderName || result.sender} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{result.senderName || result.sender}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{result.sender}</p>
          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{result.title}</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{result.snippet}</p>
        </div>
      </div>
      <Badge tone={tone}>{result.matchLabel}</Badge>
    </button>
  );
}
