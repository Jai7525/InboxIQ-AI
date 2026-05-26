import { Avatar } from "../ui/Avatar";
import { CommandSparkIcon } from "./CommandSparkIcon";

export function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <CommandSparkIcon className="h-9 w-9 rounded-xl" iconSize={17} />
      ) : null}
      <div
        className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-primary-light text-white dark:bg-primary-dark"
            : "border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        }`}
      >
        {Array.isArray(message.content) ? (
          <div>
            {message.heading ? <p className="mb-3 font-semibold">{message.heading}</p> : null}
            <ol className="list-decimal space-y-2 pl-5">
              {message.content.map((item) => (
                <li key={item} className="break-words">
                  {item}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="space-y-2">
            {message.content.split(/\n+/).map((line) =>
              line.startsWith("- ") ? (
                <p key={line} className="break-words">
                  {line}
                </p>
              ) : (
                <p key={line} className="whitespace-pre-wrap break-words">
                  {line}
                </p>
              ),
            )}
          </div>
        )}
      </div>
      {isUser ? <Avatar name="User" /> : null}
    </div>
  );
}
