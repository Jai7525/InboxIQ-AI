import { Search, ShieldCheck, Sparkles } from "lucide-react";
import { SenderIcon } from "../ui/SenderIcon";
import { CommandSparkIcon } from "./CommandSparkIcon";
import { ChatMessage } from "./ChatMessage";

export function ChatWindow({ messages, sources, suggestions = [], onSelectSuggestion, onOpenSource }) {
  return (
    <div className="flex-1 overflow-y-auto pr-1">
      {messages.length ? (
        <div className="space-y-5">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      ) : (
        <div className="relative h-full min-h-[calc(100vh-340px)] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 dark:border-white/10 dark:from-slate-950/40 dark:to-slate-950/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(99,102,241,0.10),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(64,152,248,0.11),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_18%,rgba(64,152,248,0.13),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(139,92,246,0.10),transparent_28%)]" />

          <div className="relative flex min-h-[520px] flex-col justify-between px-6 py-7 lg:px-9">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
              <div className="flex flex-col items-center text-center">
                <CommandSparkIcon className="h-12 w-12" iconSize={20} />

                <p className="mt-5 text-3xl font-bold tracking-normal text-slate-950 dark:text-white">InboxIQ AI</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Ask about your mailbox, summarize important threads, or inspect suspicious messages with context from your synced inbox.
                </p>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
                      <Search size={17} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Semantic search</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Find the right email even when you only remember the idea.</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
                      <Sparkles size={17} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">AI summaries</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Condense long messages into decisions and next steps.</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
                      <ShieldCheck size={17} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Threat review</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Check flagged senders, links, and risky patterns.</p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-5xl border-t border-slate-200/80 pt-4 dark:border-white/10">
              <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => onSelectSuggestion?.(suggestion)}
                    className="rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-white hover:text-slate-950 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {sources.length ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-slate-950/40">
          <p className="border-b border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 dark:border-white/10 dark:text-white">Sources</p>
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {sources.map((source) => (
              <button
                key={`${source.id || source.title}-${source.meta}`}
                type="button"
                onClick={() => onOpenSource?.(source)}
                disabled={!source.id}
                className="grid w-full gap-3 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-white/5 dark:disabled:hover:bg-transparent sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px]"
                title={source.id ? "Open this email in Inbox" : "This saved source is missing an email id"}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <SenderIcon sender={source.sender || source.meta} name={source.senderName || source.title} size="sm" />
                  <span className="truncate font-semibold text-slate-900 dark:text-white">{source.title}</span>
                </div>
                <span className="truncate">{source.meta}</span>
                <span className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{source.time}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
