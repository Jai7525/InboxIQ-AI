import { useEffect, useMemo, useState } from "react";
import { EmailFilters } from "../components/inbox/EmailFilters";
import { EmailList } from "../components/inbox/EmailList";
import { EmailPreview } from "../components/inbox/EmailPreview";
import { InboxTabs } from "../components/inbox/InboxTabs";
import { api } from "../services/api";

function matchesTab(email, tab) {
  if (tab.startsWith("Important")) return email.category === "important" || email.category === "urgent";
  if (tab.startsWith("Urgent")) return email.category === "urgent";
  if (tab.startsWith("Unread")) return email.unread;
  if (tab.startsWith("Attachments")) return email.attachment;
  return true;
}

function matchesPriority(email, priority) {
  if (priority === "all") return true;
  return email.category === priority;
}

function formatEmailTime(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function hasExplicitThreatEvidence(email = {}, subject = "", body = "") {
  const metadataReasons = Array.isArray(email.metadata?.threat_reasons) ? email.metadata.threat_reasons.join(" ") : "";
  const suggestedActions = Array.isArray(email.suggested_actions) ? email.suggested_actions.join(" ") : "";
  const text = `${subject} ${body} ${email.sender || ""} ${metadataReasons} ${suggestedActions}`.toLowerCase();
  const threatLevel = `${email.threat_level || ""}`.toLowerCase();
  const hasThreatLabel = ["malicious", "phishing"].includes(threatLevel) || Number(email.threat_score || 0) >= 0.85;

  return hasThreatLabel && /(suspicious link|url has suspicious|domain mismatch|spoof|phishing|credential|password|login|verify account|fake invoice|invoice scam|payment scam|gift card|wire transfer|bank account|wallet|seed phrase)/i.test(text);
}

function getTone(email) {
  if (hasExplicitThreatEvidence(email, email.subject, email.body || email.snippet)) return "danger";
  if (email.priority >= 8) return "danger";
  if (email.priority >= 7) return "warning";
  return "neutral";
}

function getCategory(email) {
  if (email.priority >= 8) return "urgent";
  if (email.priority >= 7) return "important";
  return email.category || "normal";
}

function getLabel(email) {
  if (hasExplicitThreatEvidence(email, email.subject, email.body || email.snippet)) return "Threat";
  if (email.priority >= 8) return "Urgent";
  if (email.priority >= 7) return "Important";
  return "Normal";
}

function splitBody(body, snippet) {
  const source = cleanEmailBody(body || snippet || "No email body available.");

  if (!source) {
    return ["No email body available."];
  }

  const paragraphs = source
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs.slice(0, 10).map((paragraph, index) => (index === 9 && paragraphs.length > 10 ? `${paragraph}...` : paragraph));
  }

  const sentences = source.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [source];
  const blocks = [];

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    const current = blocks[blocks.length - 1] || "";

    if (!current || current.length + trimmed.length > 260) {
      blocks.push(trimmed);
    } else {
      blocks[blocks.length - 1] = `${current} ${trimmed}`;
    }
  });

  return blocks.slice(0, 8).map((paragraph, index) => (index === 7 && blocks.length > 8 ? `${paragraph}...` : paragraph));
}

function decodeHtmlEntities(value = "") {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function cleanEmailText(value = "") {
  const decoded = decodeHtmlEntities(value);
  return decodeHtmlEntities(stripHtmlShell(decoded))
    .replace(/[\u034f\u200c\ufeff]/g, "")
    .replace(/\[image:[^\]]+\]/gi, "")
    .replace(/<https?:\/\/[^>\s]+>/gi, "[link]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanEmailBody(value = "") {
  const decoded = decodeHtmlEntities(value);
  return decodeHtmlEntities(stripHtmlShell(decoded))
    .replace(/[\u034f\u200c\ufeff]/g, "")
    .replace(/\[image:[^\]]+\]/gi, "")
    .replace(/<https?:\/\/[^>\s]+>/gi, "[link]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripHtmlShell(value = "") {
  return value
    .replace(/<!doctype[^>]*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<xml[\s\S]*?<\/xml>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function summarizeText(value = "", maxLength = 220) {
  const cleaned = cleanEmailText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function getSummaryIntent(subject = "", body = "", email = {}) {
  const text = `${subject} ${body}`.toLowerCase();

  if (hasExplicitThreatEvidence(email, subject, body)) {
    return "This looks like a risky email with phishing or scam indicators";
  }
  if (text.includes("interview")) return "This looks like an interview update";
  if (text.includes("payment") || text.includes("invoice") || text.includes("due")) return "This looks like a payment or billing update";
  if (text.includes("placement") || text.includes("hiring") || text.includes("internship") || text.includes("job")) return "This looks like a placement or career opportunity";
  if (text.includes("security") || text.includes("sign-in") || text.includes("account")) return "This looks like an account or security notification";
  if (text.includes("course") || text.includes("program") || text.includes("webinar") || text.includes("workshop")) return "This looks like a learning or event update";
  if (text.includes("newsletter") || text.includes("digest")) return "This looks like a newsletter or digest";
  if (text.includes("sale") || text.includes("offer") || text.includes("discount")) return "This looks like a promotional offer";

  return "This looks like a general inbox update";
}

function pickSummaryDetail(body = "") {
  const cleaned = cleanEmailBody(body)
    .replace(/\b(hi|hello|dear)\s+[a-z0-9 ._-]+,?/i, "")
    .replace(/\bregards?,?\s+.*$/i, "")
    .trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const ignore = /(unsubscribe|trouble reading|view in browser|privacy policy|terms of service|facebook|instagram|youtube|copyright)/i;
  const preferred = /(deadline|apply|register|interview|payment|due|hiring|internship|job|security|sign-in|program|course|workshop|meeting|schedule|selected|shortlisted|offer)/i;
  const candidates = sentences.map((sentence) => sentence.trim()).filter((sentence) => sentence.length > 35 && !ignore.test(sentence));
  const detail = candidates.find((sentence) => preferred.test(sentence)) || candidates[0] || cleaned;

  return detail.replace(/\s+/g, " ").slice(0, 180).trim();
}

function getSuggestedAction(subject = "", body = "", email = {}) {
  const text = `${subject} ${body}`.toLowerCase();

  if (hasExplicitThreatEvidence(email, subject, body)) return "Avoid opening links or replying until you verify the sender.";
  if (text.includes("apply") || text.includes("register")) return "Review the eligibility details and apply or register only if it is relevant.";
  if (text.includes("interview")) return "Check the time, meeting link, and any preparation instructions.";
  if (text.includes("payment") || text.includes("due")) return "Verify the amount and due date before making a payment.";
  if (text.includes("security") || text.includes("sign-in")) return "Confirm whether the account activity was yours.";
  if (text.includes("deadline")) return "Check the deadline and decide quickly if action is needed.";
  if (text.includes("newsletter") || text.includes("digest")) return "Skim it if the topic is useful; no urgent action is needed.";

  return "Open the email if you need the full details.";
}

function senderDisplayName(sender = "") {
  return sender
    .replace(/<[^>]+>/g, "")
    .replace(/["']/g, "")
    .trim();
}

function senderEmailAddress(sender = "") {
  const match = sender.match(/<([^>]+)>/);
  return match?.[1] || sender;
}

function generateEmailSummary({ subject, body, email, sender }) {
  const cleanedBody = cleanEmailBody(body || "");
  const intent = getSummaryIntent(subject, cleanedBody, email);
  const detail = pickSummaryDetail(cleanedBody || subject);
  const action = getSuggestedAction(subject, cleanedBody, email);
  const senderName = senderDisplayName(sender);
  const senderText = senderName && senderName !== "Unknown sender" ? ` from ${senderName}` : "";

  if (!detail) {
    return `${intent}${senderText}. ${action}`.trim();
  }

  return `${intent}${senderText}. Main point: ${detail}. ${action}`.trim();
}

function buildAttachments(metadata = {}) {
  const rawAttachments = Array.isArray(metadata.attachments) ? metadata.attachments : [];
  const attachmentNames = [
    ...rawAttachments,
    metadata.filename,
    typeof metadata.attachment === "string" ? metadata.attachment : null,
  ].filter(Boolean);

  if (!attachmentNames.length && metadata.attachment) {
    attachmentNames.push("Email attachment");
  }

  return attachmentNames.map((attachment, index) => {
    if (typeof attachment === "object") {
      return {
        name: attachment.name || attachment.filename || `Attachment ${index + 1}`,
        size: attachment.size || attachment.file_size || metadata.attachment_size || "",
      };
    }

    return {
      name: attachment,
      size: metadata.attachment_size || metadata.size || "",
    };
  });
}

function mapBackendEmail(email, index) {
  const subject = cleanEmailText(email.subject || "Untitled email");
  const rawSender = email.sender || "Unknown sender";
  const sender = cleanEmailText(senderDisplayName(rawSender) || rawSender);
  const senderAddress = senderEmailAddress(rawSender);
  const snippet = summarizeText(email.snippet || email.body || "No preview available.");
  const attachments = buildAttachments(email.metadata);
  const aiSummary = generateEmailSummary({ subject, body: email.body || email.snippet, email, sender });

  return {
    id: email.id,
    from: sender,
    address: senderAddress,
    subject,
    preview: snippet,
    summary: aiSummary,
    body: splitBody(email.body, email.snippet),
    time: formatEmailTime(email.received_at),
    tone: getTone(email),
    label: getLabel(email),
    category: getCategory(email),
    unread: Boolean(email.unread ?? email.is_unread ?? email.metadata?.unread),
    starred: email.priority >= 7,
    attachment: attachments.length > 0,
    attachments,
    order: Date.parse(email.received_at) || index,
  };
}

function extractEmailAddress(value = "") {
  const match = value.match(/<([^>]+)>/);
  return match?.[1] || value;
}

function buildTabs(items) {
  const important = items.filter((email) => email.category === "important" || email.category === "urgent").length;
  const urgent = items.filter((email) => email.category === "urgent").length;
  const unread = items.filter((email) => email.unread).length;
  const attachments = items.filter((email) => email.attachment).length;

  return [
    `All (${items.length})`,
    `Important (${important})`,
    `Urgent (${urgent})`,
    `Unread (${unread})`,
    `Attachments (${attachments})`,
  ];
}

export default function Inbox() {
  const [inboxEmails, setInboxEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabs = useMemo(() => buildTabs(inboxEmails), [inboxEmails]);
  const [activeTab, setActiveTab] = useState("All (0)");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadEmails() {
      try {
        const data = await api.getEmails({ limit: 50 });
        const mappedEmails = (data?.emails || []).map(mapBackendEmail);

        if (!ignore) {
          setInboxEmails(mappedEmails);
          const storedEmailId = sessionStorage.getItem("inboxiq-selected-email-id");
          const selectedEmail = mappedEmails.find((email) => email.id === storedEmailId);
          if (storedEmailId) {
            sessionStorage.removeItem("inboxiq-selected-email-id");
          }
          const storedQuery = sessionStorage.getItem("inboxiq-inbox-query");
          if (storedQuery) {
            sessionStorage.removeItem("inboxiq-inbox-query");
            setQuery(storedQuery);
          }
          const storedTab = sessionStorage.getItem("inboxiq-inbox-tab");
          if (storedTab) {
            sessionStorage.removeItem("inboxiq-inbox-tab");
            const nextTab = buildTabs(mappedEmails).find((tab) => tab.startsWith(storedTab));
            if (nextTab) {
              setActiveTab(nextTab);
            }
          }
          setSelectedEmailId(selectedEmail?.id || mappedEmails[0]?.id || null);
          setError("");
        }
      } catch (error) {
        if (!ignore) {
          setInboxEmails([]);
          setSelectedEmailId(null);
          setError("Could not load /emails. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadEmails();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, tabs]);

  const filteredEmails = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = inboxEmails.filter((email) => {
      const searchableText = `${email.from} ${email.address} ${email.subject} ${email.preview} ${email.summary}`.toLowerCase();
      return matchesTab(email, activeTab) && matchesPriority(email, priority) && searchableText.includes(normalizedQuery);
    });

    return [...result].sort((a, b) => {
      if (sort === "oldest") return a.order - b.order;
      if (sort === "priority") return Number(b.category === "urgent") - Number(a.category === "urgent") || Number(b.category === "important") - Number(a.category === "important");
      return b.order - a.order;
    });
  }, [activeTab, inboxEmails, priority, query, sort]);

  const selectedEmail = filteredEmails.find((email) => email.id === selectedEmailId) || filteredEmails[0];

  const handleReply = (email) => {
    const to = encodeURIComponent(extractEmailAddress(email.address || email.from));
    const subject = encodeURIComponent(`Re: ${email.subject}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Inbox Intelligence</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your emails organized and prioritized by AI.</p>
        </div>
      </div>

      <InboxTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <EmailFilters
        query={query}
        onQueryChange={setQuery}
      />

      {actionMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <EmailList emails={filteredEmails} selectedEmailId={selectedEmail?.id} onSelectEmail={(email) => setSelectedEmailId(email.id)} loading={loading} error={error} />
        <EmailPreview
          email={selectedEmail}
          onReply={handleReply}
        />
      </div>
    </div>
  );
}
