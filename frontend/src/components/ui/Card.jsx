export function Card({ children, className = "", as: Component = "section", ...props }) {
  return (
    <Component className={`app-card ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({ title, action, eyebrow, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        {eyebrow ? <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{eyebrow}</p> : null}
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
