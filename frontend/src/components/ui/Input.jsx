import { forwardRef } from "react";

export const Input = forwardRef(function Input({ className = "", invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
        invalid
          ? "border-error focus:border-error focus:ring-red-100 dark:focus:ring-red-500/15"
          : "border-slate-200 focus:border-primary-light focus:ring-indigo-100 dark:border-white/10 dark:focus:border-primary-dark dark:focus:ring-sky-500/10"
      } ${className}`}
      {...props}
    />
  );
});
