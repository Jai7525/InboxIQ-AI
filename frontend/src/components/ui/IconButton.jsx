export function IconButton({
  children,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
    secondary:
      "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15",
    primary:
      "bg-primary-light text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 dark:bg-primary-dark dark:shadow-sky-500/20 dark:hover:bg-sky-400",
    danger: "bg-red-50 text-error hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/20",
  };

  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
