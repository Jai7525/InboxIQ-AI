import { Card, CardHeader } from "../ui/Card";

export function ActivityPanel({ title, items }) {
  return (
    <Card className="p-5">
      <CardHeader title={title} action={<button className="text-xs font-semibold text-primary-light dark:text-primary-dark">View all</button>} />
      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.className}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
