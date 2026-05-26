import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function ThreatAlerts({ alerts, loading = false, error = "", onOpenAlert, onViewAll }) {
  return (
    <Card className="p-5">
      <CardHeader
        title="Threat Alerts"
        action={
          <button type="button" onClick={onViewAll} className="text-xs font-semibold text-primary-light dark:text-primary-dark">
            View all
          </button>
        }
      />
      <div className="mt-4 space-y-4">
        {error ? (
          <StateMessage type="error" title="Threat alerts unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={3} />
        ) : alerts.length === 0 ? (
          <StateMessage type="empty" title="No threats detected" description="Suspicious emails will appear here when found." />
        ) : (
          alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <button
                key={alert.id || alert.title}
                type="button"
                onClick={() => onOpenAlert?.(alert)}
                className="flex w-full gap-3 rounded-xl p-1 text-left hover:bg-slate-50 dark:hover:bg-white/5"
              >
                {alert.sender ? (
                  <SenderIcon sender={alert.sender} name={alert.sender} size="md" className="mt-0.5" />
                ) : (
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 ${alert.className}`}>
                    <Icon size={15} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{alert.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{alert.meta}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
