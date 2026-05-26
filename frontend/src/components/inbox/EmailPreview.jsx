import { Download, FileText, Reply } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SenderIcon } from "../ui/SenderIcon";

export function EmailPreview({ email, onReply }) {
  if (!email) {
    return (
      <Card className="flex min-h-72 items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Select an email to preview the original message.
      </Card>
    );
  }

  const bodyBlocks = Array.isArray(email.body) && email.body.length ? email.body : ["No email body available."];
  const attachments = Array.isArray(email.attachments) ? email.attachments : [];

  return (
    <Card className="min-w-0 overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <SenderIcon sender={email.address || email.from} name={email.from} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preview</p>
            <h2 className="mt-4 break-words text-lg font-bold text-slate-950 dark:text-white">{email.subject}</h2>
            <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{email.from}</p>
            <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">{email.address || email.from}</p>
          </div>
        </div>
        {email.tone !== "neutral" ? <Badge tone={email.tone}>{email.label}</Badge> : null}
      </div>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{email.time}</p>
        <Button size="sm" onClick={() => onReply?.(email)}>
          <Reply size={15} />
          Reply
        </Button>
      </div>

      {email.summary ? (
        <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-sky-500/15 dark:bg-sky-500/10">
          <p className="text-xs font-semibold uppercase text-primary-light dark:text-primary-dark">AI Summary</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{email.summary}</p>
        </div>
      ) : null}

      <div className="space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
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
