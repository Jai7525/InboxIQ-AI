import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function TopSenderStats({ senders, loading = false, error = "" }) {
  return (
    <Card className="p-5">
      <CardHeader title="Top Sender Stats" action={<span className="text-xs text-slate-500 dark:text-slate-400">This Month</span>} />
      <div className="mt-4 space-y-4">
        {error ? (
          <StateMessage type="error" title="Top senders unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={5} />
        ) : senders.length === 0 ? (
          <StateMessage type="empty" title="No sender data" description="Sender stats will appear after emails are synced." />
        ) : (
          senders.map((sender) => (
            <div key={sender.name} className="flex items-center gap-3">
              <SenderIcon sender={sender.email} name={sender.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{sender.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sender.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{sender.count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sender.change}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
