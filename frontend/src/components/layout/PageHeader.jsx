export function PageHeader({ title, description, actions, eyebrow, className = "" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-light dark:text-primary-dark">{eyebrow}</p> : null}
        <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
