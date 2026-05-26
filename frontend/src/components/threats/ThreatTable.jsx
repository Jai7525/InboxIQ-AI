import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";
import { Table } from "../ui/Table";
import { ThreatBadge } from "./ThreatBadge";

export function ThreatTable({ threats, loading = false, error = "", onViewThreat, totalThreats = 0, showAll = false, onToggleShowAll }) {
  const columns = [
    {
      key: "email",
      header: "Email",
      cellClassName: "font-semibold text-slate-900 dark:text-white",
      render: (threat) => (
        <div className="flex min-w-0 items-center gap-3">
          <SenderIcon sender={threat.sender} name={threat.senderName || threat.sender} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{threat.email}</p>
            <p className="truncate text-xs font-normal text-slate-500 dark:text-slate-400">{threat.sender}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sender",
      header: "Sender",
      render: (threat) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{threat.senderName || threat.sender}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{threat.sender}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Threat Type",
      render: (threat) => <ThreatBadge level={threat.type} />,
    },
    {
      key: "detectedOn",
      header: "Detected On",
      render: (threat) => <span className="text-slate-500 dark:text-slate-400">{threat.detectedOn}</span>,
    },
    {
      key: "reason",
      header: "Reason",
      render: (threat) => <span className="line-clamp-2 break-words text-slate-600 dark:text-slate-300">{threat.reason}</span>,
    },
    {
      key: "action",
      header: "Action",
      render: (threat) => (
        <Button variant="ghost" size="sm" onClick={() => onViewThreat?.(threat)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <CardHeader title="Threat Emails" />
      </div>
      {error ? (
        <div className="border-t border-slate-200 p-5 dark:border-white/10">
          <StateMessage type="error" title="Threat emails unavailable" description={error} />
        </div>
      ) : loading ? (
        <div className="border-t border-slate-200 p-5 dark:border-white/10">
          <ListSkeleton rows={5} />
        </div>
      ) : (
        <Table
          columns={columns}
          rows={threats}
          getRowKey={(threat) => threat.id || threat.email}
          emptyMessage="No threat emails detected."
          className="rounded-none border-x-0 border-b-0 bg-transparent dark:bg-transparent [&_table]:min-w-[980px]"
        />
      )}
      {!loading && !error && totalThreats > 5 ? (
        <div className="border-t border-slate-200 p-4 dark:border-white/10">
          <Button variant="secondary" size="sm" className="w-full" onClick={onToggleShowAll}>
            {showAll ? "Show Fewer Threats" : "View All Threats"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
