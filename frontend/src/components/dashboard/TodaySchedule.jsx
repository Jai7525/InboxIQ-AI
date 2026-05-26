import { CalendarClock, CalendarDays, Video } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";

export function TodaySchedule({ events, loading = false, error = "", onOpenEvent, onViewCalendar }) {
  return (
    <Card className="theme-fast-surface p-4">
      <CardHeader
        title="Today's Schedule"
        action={
          <button type="button" onClick={onViewCalendar} className="text-xs font-semibold text-primary-light dark:text-primary-dark">
            View calendar
          </button>
        }
      />
      <div className="mt-4 space-y-3">
        {error ? (
          <StateMessage type="error" title="Schedule unavailable" description={error} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : events.length === 0 ? (
          <StateMessage type="empty" title="No schedule found" description="Meeting and calendar emails will appear here after sync." />
        ) : (
        events.map((event) => (
          <button
            key={event.id || event.title}
            type="button"
            onClick={() => onOpenEvent?.(event)}
            className="grid w-full grid-cols-[64px_28px_1fr] items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{event.time}</div>
            <div className={`flex h-6 w-6 items-center justify-center rounded-md ${event.virtual ? "bg-emerald-50 text-success dark:bg-emerald-500/15" : "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark"}`}>
              {event.virtual ? <Video size={13} /> : event.calendar ? <CalendarDays size={13} /> : <CalendarClock size={13} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{event.title}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{event.location}</p>
            </div>
          </button>
        ))
        )}
      </div>
    </Card>
  );
}
