import { CalendarDays, Mail } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function UpcomingReminders({ reminders, loading = false, error = "", onOpenReminder, onViewAll }) {
  return (
    <Card className="h-full p-4">
      <CardHeader
        title="Upcoming Reminders"
        action={
          <button type="button" onClick={onViewAll} className="text-xs font-semibold text-primary-light dark:text-primary-dark">
            View all
          </button>
        }
      />
      <div className="mt-4 space-y-2.5">
        {error ? (
          <StateMessage type="error" title="Reminders unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={3} />
        ) : reminders.length === 0 ? (
          <StateMessage type="empty" title="No reminders found" description="Reminder emails will appear here after sync." />
        ) : (
        reminders.map((reminder) => {
          const Icon = reminder.type === "mail" ? Mail : CalendarDays;
          return (
            <button
              key={reminder.id || reminder.title}
              type="button"
              onClick={() => onOpenReminder?.(reminder)}
              className="subtle-panel flex w-full items-center gap-3 p-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${reminder.type === "mail" ? "bg-amber-50 text-warning dark:bg-amber-500/15" : "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark"}`}>
                <Icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{reminder.title}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{reminder.due}</p>
              </div>
            </button>
          );
        })
        )}
      </div>
    </Card>
  );
}
