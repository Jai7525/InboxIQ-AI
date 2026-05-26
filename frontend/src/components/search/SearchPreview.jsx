import { Download, ExternalLink, FileText } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";

export function SearchPreview({ result, onOpenEmail }) {
  if (!result) {
    return (
      <Card className="flex min-h-72 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Select a result to preview the semantic match.
      </Card>
    );
  }

  const bodyBlocks = Array.isArray(result.bodyBlocks) && result.bodyBlocks.length ? result.bodyBlocks : [result.body || "No email body available."];
  const attachments = Array.isArray(result.attachments) ? result.attachments : [];

  return (
    <Card className="min-w-0 overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <SenderIcon sender={result.sender} name={result.senderName || result.sender} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preview</p>
            <h2 className="mt-4 break-words text-lg font-bold text-slate-950 dark:text-white">{result.title}</h2>
            <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{result.senderName || result.sender}</p>
            <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{result.sender}</p>
          </div>
        </div>
        <Badge tone={result.matchScore >= 90 ? "success" : "warning"}>{result.matchLabel}</Badge>
      </div>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{result.date}</p>
        <Button variant="secondary" size="sm" onClick={() => onOpenEmail?.(result)}>
          <ExternalLink size={15} />
          Open Email
        </Button>
      </div>

      {result.aiSummary ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-sky-500/15 dark:bg-sky-500/10">
          <p className="text-xs font-semibold uppercase text-primary-light dark:text-primary-dark">AI Summary</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{result.aiSummary}</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {bodyBlocks.map((block) =>
          Array.isArray(block) ? (
            <ul key={block.join("-")} className="list-disc space-y-1 pl-5">
              {block.map((item) => (
                <li key={item} className="break-words">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p key={block} className="whitespace-pre-wrap break-words">
              {block}
            </p>
          ),
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-950 dark:text-white">Attachments ({attachments.length})</p>
        {attachments.length ? (
          <div className="mt-3 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={`${attachment.name}-${attachment.size || ""}`}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/10">
                    <FileText size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{attachment.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{attachment.size || "Unknown size"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Download ${attachment.name}`}>
                  <Download size={16} />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
