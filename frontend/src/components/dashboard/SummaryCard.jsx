import { Sparkles } from "lucide-react";
import { Card } from "../ui/Card";

export function SummaryCard() {
  return (
    <Card className="relative overflow-hidden p-6">
      <div className="max-w-xl">
        <div className="mb-4 flex items-center gap-2 text-primary-light dark:text-primary-dark">
          <Sparkles size={18} />
          <h2 className="text-lg font-bold">AI Inbox Summary</h2>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Today you received <strong className="text-slate-950 dark:text-white">42 emails</strong>, including 5 important
          messages, 2 urgent follow-ups, and 1 suspicious email requiring review.
        </p>
      </div>
      <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="relative flex h-32 w-44 items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-indigo-100 dark:bg-sky-500/15" />
          <div className="absolute h-32 w-32 rounded-full border border-indigo-100 dark:border-sky-500/20" />
          <div className="relative rotate-[-10deg] rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-5 text-white shadow-xl shadow-indigo-500/25">
            <Sparkles size={38} fill="currentColor" />
          </div>
        </div>
      </div>
    </Card>
  );
}
