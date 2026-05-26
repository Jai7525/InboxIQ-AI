import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { Card } from "../ui/Card";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Card className="p-5">
      <button
        type="button"
        onClick={toggleTheme}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
            {isDark ? <Moon size={19} /> : <Sun size={19} />}
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-950 dark:text-white">Theme</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{isDark ? "Dark mode enabled" : "Light mode enabled"}</span>
          </span>
        </span>
        <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${isDark ? "bg-primary-dark" : "bg-slate-300"}`}>
          <span className={`h-5 w-5 rounded-full bg-white transition ${isDark ? "translate-x-5" : ""}`} />
        </span>
      </button>
    </Card>
  );
}
