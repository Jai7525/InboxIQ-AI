import { Button } from "../ui/Button";

export function IntegrationCard({ integration, onAction }) {
  const Icon = integration.icon;

  return (
    <div className="flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-950 dark:text-white">{integration.name}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{integration.detail}</p>
      </div>
      {integration.connected ? (
        <Button variant="ghost" size="sm" onClick={() => onAction?.(integration)}>
          {integration.actionLabel || "Manage"}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => onAction?.(integration)} disabled={integration.disabled}>
          {integration.actionLabel || "Connect"}
        </Button>
      )}
    </div>
  );
}
