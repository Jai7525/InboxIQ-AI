import { Dropdown } from "../ui/Dropdown";
import { Tabs } from "../ui/Tabs";

const sourceTabs = ["All Sources", "Emails", "Attachments", "From"];

const sortOptions = [
  { label: "Sort: Relevance", value: "relevance" },
  { label: "Newest first", value: "newest" },
  { label: "Highest match", value: "match" },
];

export function SearchFilters({ activeSource, onSourceChange, sort, onSortChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs tabs={sourceTabs} activeTab={activeSource} onChange={onSourceChange} />
      <div className="flex gap-2">
        <Dropdown value={sort} options={sortOptions} onChange={onSortChange} className="w-40" />
      </div>
    </div>
  );
}
