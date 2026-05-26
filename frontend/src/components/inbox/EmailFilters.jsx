import { Search } from "lucide-react";
import { Input } from "../ui/Input";

export function EmailFilters({ query, onQueryChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search sender, subject, or summary"
          className="pl-9"
        />
      </label>
    </div>
  );
}
