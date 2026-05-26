export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/10 ${className}`} />;
}

export function TextSkeleton({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4, avatar = true, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          {avatar ? <Skeleton className="h-9 w-9 shrink-0 rounded-full" /> : null}
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="app-card min-w-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>
    </div>
  );
}
