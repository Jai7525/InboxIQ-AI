import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const suggestions = ["Show urgent emails", "Find internship opportunities", "Find payment reminders"];

export function SemanticSearchBar({ query, onQueryChange, onSearch }) {
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [typedSuggestion, setTypedSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(true);
  const inputRef = useRef(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (userInteractedRef.current || !showSuggestion) return undefined;

    const text = suggestions[suggestionIndex];
    let cursor = 0;
    let nextTimer;

    setTypedSuggestion("");

    const typingTimer = window.setInterval(() => {
      if (userInteractedRef.current) {
        window.clearInterval(typingTimer);
        return;
      }

      cursor += 1;
      setTypedSuggestion(text.slice(0, cursor));

      if (cursor >= text.length) {
        window.clearInterval(typingTimer);
        nextTimer = window.setTimeout(() => {
          if (!userInteractedRef.current) {
            setSuggestionIndex((current) => (current + 1) % suggestions.length);
          }
        }, 2400);
      }
    }, 45);

    return () => {
      window.clearInterval(typingTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [showSuggestion, suggestionIndex]);

  const stopSuggestion = () => {
    userInteractedRef.current = true;
    setShowSuggestion(false);
    setTypedSuggestion("");
  };

  const acceptSuggestion = () => {
    const accepted = typedSuggestion || suggestions[suggestionIndex];
    userInteractedRef.current = true;
    setShowSuggestion(false);
    onQueryChange?.(accepted);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(accepted.length, accepted.length);
    });
  };

  useEffect(() => {
    if (query || !showSuggestion) return undefined;

    const handleGlobalKeyDown = (event) => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      acceptSuggestion();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [query, showSuggestion, typedSuggestion, suggestionIndex]);

  return (
    <form
      className="flex gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const nextQuery = query.trim();
        if (nextQuery) {
          onSearch?.(nextQuery);
        }
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        {!query && showSuggestion ? (
          <div className="pointer-events-none absolute left-10 right-32 top-1/2 flex -translate-y-1/2 items-center overflow-hidden text-sm text-slate-400">
            <span className="truncate">{typedSuggestion || suggestions[suggestionIndex]}</span>
            <span className="ml-0.5 h-5 w-px shrink-0 animate-pulse bg-primary-light dark:bg-primary-dark" />
          </div>
        ) : null}
        <Input
          ref={inputRef}
          className="pl-10 pr-32"
          value={query}
          onChange={(event) => {
            stopSuggestion();
            onQueryChange(event.target.value);
          }}
          onMouseDown={stopSuggestion}
          onKeyDown={(event) => {
            if (event.key === "Tab" && !query && showSuggestion) {
              event.preventDefault();
              acceptSuggestion();
            } else if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") {
              stopSuggestion();
            }
          }}
          placeholder=""
        />
        {!query && showSuggestion ? (
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 text-xs font-semibold text-slate-400 sm:block">
            Tab to accept
          </span>
        ) : null}
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}
