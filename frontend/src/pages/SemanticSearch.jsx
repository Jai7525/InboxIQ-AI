import { useEffect, useMemo, useState } from "react";
import { SearchFilters } from "../components/search/SearchFilters";
import { SearchPreview } from "../components/search/SearchPreview";
import { SearchResults } from "../components/search/SearchResults";
import { SemanticSearchBar } from "../components/search/SemanticSearchBar";
import { api } from "../services/api";

function sourceMatches(result, activeSource) {
  if (activeSource === "All Sources") return true;
  if (activeSource === "Emails") return result.source === "email";
  if (activeSource === "Attachments") return result.source === "attachment";
  if (activeSource === "From") return Boolean(result.sender);
  return true;
}

function formatResultDate(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getMatchLabel(score) {
  return `${Math.round((score || 0) * 100)}% match`;
}

function decodeHtmlEntities(value = "") {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
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

function hasExplicitThreatEvidence(email = {}, subject = "", body = "") {
  const metadataReasons = Array.isArray(email.metadata?.threat_reasons) ? email.metadata.threat_reasons.join(" ") : "";
  const suggestedActions = Array.isArray(email.suggested_actions) ? email.suggested_actions.join(" ") : "";
  const text = `${subject} ${body} ${email.sender || ""} ${metadataReasons} ${suggestedActions}`.toLowerCase();
  const threatLevel = `${email.threat_level || ""}`.toLowerCase();
  const hasThreatLabel = ["malicious", "phishing"].includes(threatLevel) || Number(email.threat_score || 0) >= 0.85;

  return hasThreatLabel && /(suspicious link|url has suspicious|domain mismatch|spoof|phishing|credential|password|login|verify account|fake invoice|invoice scam|payment scam|gift card|wire transfer|bank account|wallet|seed phrase)/i.test(text);
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

function truncateText(value = "", maxLength = 900) {
  const cleaned = cleanEmailText(value);

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 3).trim()}...`;
}

function getQueryTerms(query = "") {
  const stopWords = new Set(["the", "and", "for", "with", "from", "about", "email", "emails", "show", "find", "search", "me", "my"]);

  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2 && !stopWords.has(term));
}

function firstMatchingTerm(text = "", terms = []) {
  const normalized = text.toLowerCase();
  return terms.find((term) => normalized.includes(term));
}

function senderDomain(sender = "") {
  const match = sender.match(/@([^>\s]+)/);
  return match?.[1]?.replace(/[>)]$/, "") || "";
}

function buildMatchReasons(query = "", email = {}, score = 0) {
  const queryTerms = getQueryTerms(query);
  const subject = cleanEmailText(email.subject || "");
  const sender = cleanEmailText(email.sender || "");
  const body = cleanEmailText(`${email.snippet || ""} ${email.body || ""}`);
  const category = cleanEmailText(email.category || "");
  const domain = senderDomain(sender);
  const reasons = [];
  const matchedSubjectTerm = firstMatchingTerm(subject, queryTerms);
  const matchedBodyTerm = firstMatchingTerm(body, queryTerms);
  const careerTerm = firstMatchingTerm(`${subject} ${body}`, [
    "hiring",
    "internship",
    "intern",
    "placement",
    "career",
    "recruitment",
    "interview",
    "opening",
    "job",
  ]);
  const senderTerm = firstMatchingTerm(sender, ["hr", "careers", "career", "recruit", "talent", "jobs", "placement", "unstop", "linkedin", "naukri"]);
  const domainTerm = firstMatchingTerm(domain, queryTerms);

  if (matchedSubjectTerm) {
    reasons.push(`Subject matches "${matchedSubjectTerm}" from your search`);
  }

  if (matchedBodyTerm && matchedBodyTerm !== matchedSubjectTerm) {
    reasons.push(`Email content mentions "${matchedBodyTerm}"`);
  }

  if (careerTerm) {
    reasons.push(`Contains career keyword "${careerTerm}"`);
  }

  if (senderTerm) {
    reasons.push(`Sender looks relevant because it includes "${senderTerm}"`);
  } else if (domainTerm) {
    reasons.push(`Sender domain "${domain}" matches "${domainTerm}"`);
  }

  if (email.metadata?.attachment || email.metadata?.filename || Array.isArray(email.metadata?.attachments)) {
    reasons.push("Includes attachment details related to the result");
  }

  if (category) {
    reasons.push(`Inbox category is "${category}"`);
  }

  if (email.priority >= 7) {
    reasons.push(`Priority score is ${email.priority}`);
  }

  if (score >= 0.85) {
    reasons.push(`${Math.round(score * 100)}% semantic similarity with your search`);
  }

  if (!reasons.length) {
    reasons.push(`${Math.round(score * 100)}% semantic similarity with your search`);
    reasons.push("Subject, sender, and message context are closest to your query");
  }

  return [...new Set(reasons)].slice(0, 3);
}

function mapSearchResult(result, index, query = "") {
  const email = result.email || {};
  const matchScore = Math.round((result.score || 0) * 100);
  const attachments = buildAttachments(email.metadata);
  const attachment = attachments[0]?.name || null;
  const title = cleanEmailText(email.subject || "Untitled email");
  const rawSender = email.sender || "Unknown sender";
  const senderName = cleanEmailText(senderDisplayName(rawSender) || rawSender);
  const sender = senderEmailAddress(rawSender);
  const snippet = truncateText(email.snippet || email.body || "No preview available.", 220);
  const aiSummary = generateEmailSummary({ subject: title, body: email.body || email.snippet, email, sender: senderName });

  return {
    id: email.id || `result-${index}`,
    title,
    sender,
    senderName,
    snippet,
    body: truncateText(email.body || email.snippet || "No email body available."),
    bodyBlocks: splitBody(email.body, email.snippet),
    aiSummary,
    reason: "Matched because:",
    matchReasons: buildMatchReasons(query, email, result.score || 0),
    source: attachment ? "attachment" : "email",
    matchScore,
    matchLabel: getMatchLabel(result.score || 0),
    date: formatResultDate(email.received_at),
    receivedAt: email.received_at || null,
    attachment,
    attachments,
    order: Date.parse(email.received_at) || index,
  };
}

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeSource, setActiveSource] = useState("All Sources");
  const [sort, setSort] = useState("relevance");
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [resultSource, setResultSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLowerCase();
    const filtered = resultSource.filter((result) => {
      const searchableText = `${result.title} ${result.sender} ${result.snippet} ${result.body} ${result.reason} ${result.attachment || ""}`.toLowerCase();
      const queryToken = normalizedQuery.split(" ")[0] || "";
      const queryMatches = queryToken ? searchableText.includes(queryToken) || hasSearched : true;
      return sourceMatches(result, activeSource) && queryMatches;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "newest") return b.order - a.order;
      if (sort === "match") return b.matchScore - a.matchScore;
      return b.matchScore - a.matchScore;
    });
  }, [activeSource, resultSource, sort, submittedQuery]);

  const selectedResult = results.find((result) => result.id === selectedResultId) || results[0];

  const runSearch = async (searchText) => {
    const nextQuery = searchText.trim();

    if (!nextQuery) return;

    setQuery(nextQuery);
    setSubmittedQuery(nextQuery);
    setLoading(true);
    setHasSearched(true);
    setError("");

    try {
      const data = await api.search({ query: nextQuery, topK: 8 });
      const mappedResults = (data?.results || []).map((result, index) => mapSearchResult(result, index, nextQuery));

      if (mappedResults.length) {
        setResultSource(mappedResults);
        setSelectedResultId(mappedResults[0].id);
      } else {
        setResultSource([]);
        setSelectedResultId(null);
      }
    } catch (error) {
      setResultSource([]);
      setSelectedResultId(null);
      setError("Could not complete semantic search. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedQuery = sessionStorage.getItem("inboxiq-search-query");

    if (storedQuery) {
      sessionStorage.removeItem("inboxiq-search-query");
      runSearch(storedQuery);
    }
  }, []);

  const handleSearch = (searchText = query) => {
    runSearch(searchText);
  };

  const handleOpenEmail = (result) => {
    if (result?.id) {
      sessionStorage.setItem("inboxiq-selected-email-id", result.id);
    }

    window.history.pushState({}, "", "/inbox");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Semantic Search</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search your organic placement material in natural language.</p>
      </div>

      <SemanticSearchBar query={query} onQueryChange={setQuery} onSearch={handleSearch} />

      <SearchFilters
        activeSource={activeSource}
        onSourceChange={setActiveSource}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SearchResults
          results={results}
          selectedResultId={selectedResult?.id}
          onSelectResult={(result) => setSelectedResultId(result.id)}
          loading={loading}
          hasSearched={hasSearched}
          error={error}
        />
        <SearchPreview result={selectedResult} onOpenEmail={handleOpenEmail} />
      </div>
    </div>
  );
}
