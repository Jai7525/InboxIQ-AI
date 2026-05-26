import { Card, CardHeader } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { SenderIcon } from "../ui/SenderIcon";

export function EmailFeed({ title, items }) {
  return (
    <Card className="p-5">
      <CardHeader title={title} action={<button className="text-xs font-semibold text-primary-light dark:text-primary-dark">View all</button>} />
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.subject} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-white/5">
            <SenderIcon sender={item.sender} name={item.senderName || item.sender} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.senderName || item.sender}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.sender}</p>
              <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{item.subject}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
              {item.badge ? <Badge tone={item.tone}>{item.badge}</Badge> : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
