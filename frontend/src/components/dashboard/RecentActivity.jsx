import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function RecentActivity({ items, loading = false, error = "" }) {
  return (
    <Card id="recent-activity" className="p-5 scroll-mt-24">
      <CardHeader title="Recent Activity" />
      <div className="mt-4 space-y-4">
        {error ? (
          <StateMessage type="error" title="Activity unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <StateMessage type="empty" title="No recent activity" description="Activity will appear after emails are synced." />
        ) : (
        items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              {item.sender ? (
                <SenderIcon sender={item.sender} name={item.senderName || item.sender} size="md" className="mt-0.5" />
              ) : (
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 ${item.className}`}>
                  <Icon size={15} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
              </div>
            </div>
          );
        })
        )}
      </div>
    </Card>
  );
}
