import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function TopSenders({ senders, loading = false, error = "" }) {
  return (
    <Card className="p-5">
      <CardHeader title="Top Senders" action={<button className="text-xs font-semibold text-primary-light dark:text-primary-dark">View all</button>} />
      <div className="mt-4 space-y-4">
        {error ? (
          <StateMessage type="error" title="Top senders unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={5} />
        ) : senders.length === 0 ? (
          <StateMessage type="empty" title="No sender data" description="Top senders will appear after emails are synced." />
        ) : (
        senders.map((sender) => (
          <div key={sender.name} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SenderIcon sender={sender.email} name={sender.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{sender.name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{sender.email}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-300">{sender.count} emails</span>
          </div>
        ))
        )}
      </div>
    </Card>
  );
}
