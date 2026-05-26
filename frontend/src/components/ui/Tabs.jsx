export function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onChange?.(tab)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            activeTab === tab
              ? "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark"
              : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
