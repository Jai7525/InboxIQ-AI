import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function Dropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  className = "",
  menuClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label ? <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} size={16} />
      </button>

      {open ? (
        <div
          className={`absolute right-0 z-30 mt-2 w-full min-w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-soft dark:border-white/10 dark:bg-slate-900 dark:shadow-glass ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange?.(option.value, option);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                option.value === value
                  ? "bg-indigo-50 font-semibold text-primary-light dark:bg-sky-500/15 dark:text-primary-dark"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {option.icon ? <option.icon size={15} /> : null}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
