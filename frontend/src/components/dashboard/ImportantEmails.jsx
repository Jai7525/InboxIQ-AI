import { Badge } from "../ui/Badge";
import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function ImportantEmails({ emails, loading = false, error = "", onOpenEmail, onViewAll }) {
  return (
    <Card className="p-5">
      <CardHeader
        title="Important Emails"
        action={
          <button type="button" onClick={onViewAll} className="text-xs font-semibold text-primary-light dark:text-primary-dark">
            View all
          </button>
        }
      />
      <div className="mt-4 space-y-3">
        {error ? (
          <StateMessage type="error" title="Important emails unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : emails.length === 0 ? (
          <StateMessage type="empty" title="No important emails" description="High-priority messages will appear here after sync." />
        ) : (
          emails.map((email) => (
            <button
              key={email.id || email.subject}
              type="button"
              onClick={() => onOpenEmail?.(email)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <SenderIcon sender={email.sender} name={email.senderName || email.sender} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{email.senderName || email.sender}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email.sender}</p>
                <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{email.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{email.time}</p>
                {email.badge ? <Badge tone={email.tone}>{email.badge}</Badge> : null}
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
