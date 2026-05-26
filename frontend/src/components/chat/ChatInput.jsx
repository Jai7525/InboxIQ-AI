import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const placeholderText = "Ask anything about your inbox...";

export function ChatInput({ value, onChange, onSubmit, loading = false }) {
  const [placeholder, setPlaceholder] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (value || focused) {
      setPlaceholder("");
      return undefined;
    }

    let cursor = 0;
    setPlaceholder("");

    const timer = window.setInterval(() => {
      cursor += 1;
      setPlaceholder(placeholderText.slice(0, cursor));

      if (cursor >= placeholderText.length) {
        window.clearInterval(timer);
      }
    }, 45);

    return () => {
      window.clearInterval(timer);
    };
  }, [value]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5"
      onSubmit={handleSubmit}
    >
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? "" : placeholder || placeholderText}
        className="border-0 bg-transparent focus:ring-0 dark:border-0 dark:bg-transparent"
      />
      <Button size="icon" type="submit" aria-label="Send message" disabled={!value.trim() || loading}>
        <Send size={17} />
      </Button>
    </form>
  );
}
