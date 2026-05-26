import { Card } from "../ui/Card";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";
import { SearchResultItem } from "./SearchResultItem";

export function SearchResults({ results, selectedResultId, onSelectResult, loading = false, hasSearched = false, error = "" }) {
  if (error) {
    return (
      <Card className="p-5">
        <StateMessage type="error" title="Search failed" description={error} />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-5">
        <ListSkeleton rows={5} />
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="p-5">
        <StateMessage
          type="empty"
          title={hasSearched ? "No semantic matches" : "Start a search"}
          description={hasSearched ? "Try a broader phrase or sync more emails before searching again." : "Use the search bar to ask about your inbox in natural language."}
        />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
      {results.map((result) => (
        <SearchResultItem
          key={result.id}
          result={result}
          selected={result.id === selectedResultId}
          onSelect={() => onSelectResult(result)}
        />
      ))}
    </Card>
  );
}
