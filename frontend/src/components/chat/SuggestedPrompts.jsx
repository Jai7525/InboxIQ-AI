import { MessageSquareText } from "lucide-react";
import { Card } from "../ui/Card";

export function SuggestedPrompts({ prompts, onSelectPrompt }) {
  return (
    <Card className="h-fit p-5">
      <h2 className="text-sm font-bold text-slate-950 dark:text-white">Suggested Prompts</h2>
      <div className="mt-4 space-y-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <MessageSquareText size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
            <span className="line-clamp-1">{prompt}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
