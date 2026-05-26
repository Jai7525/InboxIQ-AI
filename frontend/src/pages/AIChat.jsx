import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ChatInput } from "../components/chat/ChatInput";
import { ChatWindow } from "../components/chat/ChatWindow";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { api } from "../services/api";

const starterPrompt = "Summarize my important emails from today";

const initialSources = [
  { title: "Interview invitation - TCS", meta: "careers@tcs.com", sender: "careers@tcs.com", time: "10:30 AM" },
  { title: "Payment Reminder", meta: "bill@amazon.com", sender: "bill@amazon.com", time: "9:15 AM" },
  { title: "Placement Update - 2024 Batch", meta: "placement@college.edu.in", sender: "placement@college.edu.in", time: "8:45 AM" },
];

const initialSessions = [
  {
    id: "welcome",
    title: "Summarize important emails",
    updatedAt: Date.now() - 2 * 60 * 1000,
    sources: initialSources,
    messages: [
      {
        id: 1,
        role: "user",
        content: starterPrompt,
      },
      {
        id: 2,
        role: "assistant",
        heading: "Here is the summary of your important emails:",
        content: [
          "Interview invitation from TCS - next round scheduled.",
          "Payment reminder from Amazon - due in 3 days.",
          "Placement update from college - new drive announced.",
          "Project collaboration - Sarah wants to connect.",
        ],
      },
    ],
  },
];

const CHAT_STORAGE_KEY = "inboxiq-chat-sessions";
const ACTIVE_CHAT_STORAGE_KEY = "inboxiq-active-chat-id";

const fallbackSuggestions = ["Summarize today's inbox", "Show urgent emails", "Find emails I should reply to", "Find recent important emails"];

function formatRelativeTime(value) {
  const diffMs = Date.now() - value;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function formatSourceTime(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recent";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAnswer(answer = "") {
  return answer
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/\*\*/g, "")
        .replace(/^\s*[-*]\s*/, "- ")
        .replace(/^\s*\d+[\).]\s*/, "")
        .trim(),
    )
    .filter((line) => line && !/^(priority|threat|suggested actions?)\s*:/i.test(line))
    .join("\n");
}

function mapChatSources(sources = []) {
  return sources
    .map((source) => source.email)
    .filter(Boolean)
    .map((email) => ({
      id: email.id,
      title: email.subject || "Referenced email",
      meta: email.sender || "Email citation",
      sender: email.sender || "",
      time: formatSourceTime(email.received_at),
    }));
}

function makeSessionTitle(content) {
  const title = content.replace(/\s+/g, " ").trim();
  return title.length > 34 ? `${title.slice(0, 31)}...` : title || "New chat";
}

function emailText(email = {}) {
  return `${email.subject || ""} ${email.sender || ""} ${email.category || ""} ${email.snippet || ""} ${email.body || ""}`.toLowerCase();
}

function hasAnyEmail(emails = [], matcher) {
  return emails.some((email) => matcher(email, emailText(email)));
}

function buildContextualPrompts(emails = []) {
  if (!emails.length) return fallbackSuggestions;

  const prompts = [];
  const addPrompt = (prompt) => {
    if (prompts.length < 4 && !prompts.includes(prompt)) {
      prompts.push(prompt);
    }
  };

  const hasPlacement = hasAnyEmail(emails, (email, text) => email.category === "recruitment" || /(placement|hiring|internship|intern|career|job|recruitment|shortlisted)/.test(text));
  const hasInterview = hasAnyEmail(emails, (email, text) => /(interview|round|shortlisted|schedule)/.test(text));
  const hasAssessment = hasAnyEmail(emails, (email, text) => /(assessment|coding test|coding round|mock test|aptitude|technical test|hackathon)/.test(text));
  const hasThreat = hasAnyEmail(emails, (email) => email.threat_level && email.threat_level !== "safe" && Number(email.threat_score || 0) >= 0.6);
  const hasDeadline = hasAnyEmail(emails, (email, text) => /(deadline|last date|due date|apply by|expires|before|today|tomorrow)/.test(text));
  const hasPayment = hasAnyEmail(emails, (email, text) => /(payment|invoice|bill|due|refund|subscription)/.test(text));
  const hasUrgent = hasAnyEmail(emails, (email, text) => email.priority >= 8 || /(urgent|asap|immediately|final call|important)/.test(text));
  const hasReply = hasAnyEmail(emails, (email, text) => /(reply|respond|confirm|rsvp|availability|action required)/.test(text) || email.suggested_actions?.some((action) => /(reply|respond|confirm)/i.test(action)));

  if (hasPlacement) addPrompt("Show placement related emails");
  if (hasInterview) addPrompt("Summarize interview invitations");
  if (hasAssessment) addPrompt("Find coding assessments");
  if (hasThreat) addPrompt("Show suspicious emails");
  if (hasThreat) addPrompt("Why was this email flagged?");
  if (hasDeadline) addPrompt("Find emails with deadlines");
  if (hasDeadline) addPrompt("Create reminders from emails");
  if (hasPayment) addPrompt("Find payment reminders");
  if (hasUrgent) addPrompt("Show urgent emails");
  if (hasReply) addPrompt("Find emails I should reply to");

  fallbackSuggestions.forEach(addPrompt);
  return prompts.slice(0, 4);
}

function loadSavedSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
    return Array.isArray(saved) && saved.length ? saved : initialSessions;
  } catch (error) {
    return initialSessions;
  }
}

function loadActiveSessionId(sessions) {
  const savedId = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
  return sessions.some((session) => session.id === savedId) ? savedId : sessions[0]?.id || null;
}

export default function AIChat({ onNavigate }) {
  const [sessions, setSessions] = useState(loadSavedSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => loadActiveSessionId(loadSavedSessions()));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextualPrompts, setContextualPrompts] = useState(fallbackSuggestions);

  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];
  const sources = activeSession?.sources || [];

  const sortedSessions = useMemo(
    () => [...sessions].sort((left, right) => right.updatedAt - left.updatedAt),
    [sessions],
  );

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    }
  }, [activeSessionId]);

  useEffect(() => {
    let ignore = false;

    async function loadPromptContext() {
      try {
        const data = await api.getEmails({ limit: 100 });
        if (!ignore) {
          setContextualPrompts(buildContextualPrompts(data?.emails || []));
        }
      } catch (error) {
        if (!ignore) {
          setContextualPrompts(fallbackSuggestions);
        }
      }
    }

    loadPromptContext();

    return () => {
      ignore = true;
    };
  }, []);

  const createNewSession = () => {
    const id = `chat-${Date.now()}`;
    const session = {
      id,
      title: "New chat",
      updatedAt: Date.now(),
      sources: [],
      messages: [],
    };

    setSessions((current) => [session, ...current]);
    setActiveSessionId(id);
    setDraft("");
  };

  const deleteSession = (sessionId) => {
    setSessions((current) => {
      const nextSessions = current.filter((session) => session.id !== sessionId);

      if (sessionId === activeSessionId) {
        setActiveSessionId(nextSessions[0]?.id || null);
      }

      return nextSessions;
    });
  };

  const openSourceEmail = (source) => {
    if (!source?.id) return;

    sessionStorage.setItem("inboxiq-selected-email-id", source.id);
    onNavigate?.("inbox");
  };

  const sendMessage = async (content = draft) => {
    const trimmedContent = content.trim();

    if (!trimmedContent || loading) return;

    let sessionId = activeSessionId;

    if (!sessionId) {
      sessionId = `chat-${Date.now()}`;
      setSessions((current) => [
        {
          id: sessionId,
          title: makeSessionTitle(trimmedContent),
          updatedAt: Date.now(),
          sources: [],
          messages: [],
        },
        ...current,
      ]);
      setActiveSessionId(sessionId);
    }

    const userMessage = { id: Date.now(), role: "user", content: trimmedContent };
    const loadingMessage = { id: Date.now() + 1, role: "assistant", content: "Thinking..." };

    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: session.messages.length ? session.title : makeSessionTitle(trimmedContent),
              updatedAt: Date.now(),
              messages: [...session.messages, userMessage, loadingMessage],
            }
          : session,
      ),
    );
    setDraft("");
    setLoading(true);

    try {
      const data = await api.chat({ question: trimmedContent, topK: 5 });
      const mappedSources = mapChatSources(data?.sources || []);

      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                sources: mappedSources,
                messages: session.messages.map((message) =>
                  message.id === loadingMessage.id
                    ? {
                        ...message,
                        content: data?.answer ? formatAnswer(data.answer) : "I could not find an answer from your indexed emails.",
                      }
                    : message,
                ),
              }
            : session,
        ),
      );
    } catch (error) {
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                sources: [],
                messages: session.messages.map((message) =>
                  message.id === loadingMessage.id
                    ? {
                        ...message,
                        content: "I could not reach the chat backend. Please check that FastAPI is running and try again.",
                      }
                    : message,
                ),
              }
            : session,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">AI Chat Assistant</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your intelligent email assistant powered by RAG.</p>
        </div>
        <Button variant="secondary" size="md" onClick={createNewSession}>
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <div className="grid min-h-[calc(100vh-210px)] gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="flex h-fit flex-col p-4">
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Recent Chats</h2>
          <div className="mt-4 space-y-3">
            {sortedSessions.length ? (
              sortedSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-start gap-2 rounded-xl p-2 transition ${
                    session.id === activeSessionId ? "bg-indigo-50 dark:bg-sky-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <button type="button" onClick={() => setActiveSessionId(session.id)} className="min-w-0 flex-1 text-left">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(session.updatedAt)}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(session.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-300 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label={`Delete ${session.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                No recent chats yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="flex min-w-0 flex-col p-5">
          <ChatWindow
            messages={messages}
            sources={sources}
            suggestions={contextualPrompts}
            onSelectSuggestion={sendMessage}
            onOpenSource={openSourceEmail}
          />
          <ChatInput value={draft} onChange={setDraft} onSubmit={sendMessage} loading={loading} />
        </Card>
      </div>
    </div>
  );
}
