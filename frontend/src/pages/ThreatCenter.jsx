import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CircleDot, ShieldCheck, ShieldQuestion, ShieldX } from "lucide-react";
import { Card } from "../components/ui/Card";
import { ProtectionTips } from "../components/threats/ProtectionTips";
import { ThreatStats } from "../components/threats/ThreatStats";
import { ThreatTable } from "../components/threats/ThreatTable";
import { api } from "../services/api";

const tips = [
  {
    title: "Review high-risk emails first",
    description: "Open flagged emails from Threat Center before acting on links, invoices, or account warnings.",
  },
  {
    title: "Verify sender identity",
    description: "Compare the sender domain with the expected company, college, or service before replying.",
  },
  {
    title: "Keep Gmail sync updated",
    description: "Sync your inbox regularly so InboxIQ can detect new suspicious emails and refresh alerts.",
  },
];

function getThreatLevel(email) {
  if (email.threat_level === "malicious" || email.threat_level === "phishing" || email.threat_score >= 0.85) {
    return "Critical";
  }

  if (email.threat_level === "spam" || email.threat_score >= 0.6) {
    return "High";
  }

  if (email.threat_level === "suspicious" || email.threat_score >= 0.3) {
    return "Medium";
  }

  return "Low";
}

function getThreatType(email) {
  if (email.threat_level === "phishing" || email.threat_level === "malicious") return "Phishing";
  if (email.threat_level === "spam") return "Spam";
  if (email.threat_level === "suspicious") return "Suspicious Link";
  return "Other";
}

function formatDetectedDate(value) {
  if (!value) return "Recent";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recent";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function cleanThreatReason(value = "") {
  const withoutUrls = value
    .replace(/<https?:\/\/[^>\s]+>/gi, "[link]")
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/\s+/g, " ")
    .trim();

  return withoutUrls.length > 160 ? `${withoutUrls.slice(0, 157).trim()}...` : withoutUrls;
}

function getThreatReason(email) {
  const reason = email.metadata?.threat_reasons?.[0] || email.suggested_actions?.[0] || email.threat_level || "Threat detected";
  return cleanThreatReason(reason);
}

function parseSender(rawSender = "") {
  const match = rawSender.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return {
      name: match[1].replaceAll('"', "").trim() || match[2],
      email: match[2],
    };
  }

  return {
    name: rawSender || "Unknown sender",
    email: rawSender || "unknown",
  };
}

function mapThreat(email) {
  const sender = parseSender(email.sender);

  return {
    id: email.id,
    email: email.subject || "Untitled email",
    sender: sender.email,
    senderName: sender.name,
    type: getThreatType(email),
    level: getThreatLevel(email),
    reason: getThreatReason(email),
    detectedOn: formatDetectedDate(email.received_at),
  };
}

function buildMetrics(items) {
  const maliciousCount = items.filter((email) => ["malicious", "phishing"].includes(email.threat_level)).length;
  const spamCount = items.filter((email) => email.threat_level === "spam").length;
  const suspiciousCount = items.filter((email) => email.threat_level === "suspicious").length;
  const reviewedCount = items.length;

  return [
    {
      label: "Phishing",
      value: String(maliciousCount),
      icon: ShieldX,
      tone: "danger",
      caption: "Detected threats",
    },
    {
      label: "Spam",
      value: String(spamCount),
      icon: AlertTriangle,
      tone: "warning",
      caption: "Detected threats",
    },
    {
      label: "Suspicious",
      value: String(suspiciousCount),
      icon: ShieldQuestion,
      tone: "warning",
      caption: "Detected threats",
    },
    {
      label: "Reviewed",
      value: String(reviewedCount),
      icon: ShieldCheck,
      tone: "success",
      caption: "Threat emails",
    },
  ];
}

function buildDistribution(items) {
  const rows = [
    { label: "Phishing", value: items.filter((email) => ["malicious", "phishing"].includes(email.threat_level)).length, color: "#2563eb" },
    { label: "Spam", value: items.filter((email) => email.threat_level === "spam").length, color: "#ef4444" },
    { label: "Suspicious", value: items.filter((email) => email.threat_level === "suspicious").length, color: "#f59e0b" },
  ];
  const knownCount = rows.reduce((sum, row) => sum + row.value, 0);
  rows.push({ label: "Others", value: Math.max(items.length - knownCount, 0), color: "#8b5cf6" });

  return rows.filter((row) => row.value > 0);
}

function ThreatDistribution({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = items
    .map((item) => {
      const start = cursor;
      const size = total ? (item.value / total) * 100 : 0;
      cursor += size;
      return `${item.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-slate-950 dark:text-white">Threat Distribution</h2>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <div
          className="relative h-32 w-32 shrink-0 rounded-full"
          style={{ background: total ? `conic-gradient(${gradient})` : "rgba(148, 163, 184, 0.25)" }}
        >
          <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-slate-950">
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{total}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
          </div>
        </div>
        <div className="w-full space-y-3">
          {items.length ? (
            items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <CircleDot size={14} style={{ color: item.color }} />
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {item.label} ({item.value})
                  </span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{Math.round((item.value / total) * 100)}%</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No threat distribution available.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ThreatCenter() {
  const [metrics, setMetrics] = useState(buildMetrics([]));
  const [threats, setThreats] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllThreats, setShowAllThreats] = useState(false);
  const visibleThreats = useMemo(() => (showAllThreats ? threats : threats.slice(0, 5)), [showAllThreats, threats]);

  const handleViewThreat = (threat) => {
    if (threat?.id) {
      sessionStorage.setItem("inboxiq-selected-email-id", threat.id);
    }

    window.history.pushState({}, "", "/inbox");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    let ignore = false;

    async function loadThreats() {
      try {
        const data = await api.getThreats();
        const backendThreats = data?.threats || [];
        const mappedThreats = backendThreats.map(mapThreat);

        if (!ignore) {
          setThreats(mappedThreats);
          setMetrics(buildMetrics(backendThreats));
          setDistribution(buildDistribution(backendThreats));
          setError("");
        }
      } catch (error) {
        if (!ignore) {
          setThreats([]);
          setMetrics(buildMetrics([]));
          setDistribution([]);
          setError("Could not load /threats. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadThreats();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Threat Center</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Detect and manage security threats in your inbox.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-5">
          <ThreatStats metrics={metrics} />
          <ThreatTable
            threats={visibleThreats}
            loading={loading}
            error={error}
            onViewThreat={handleViewThreat}
            totalThreats={threats.length}
            showAll={showAllThreats}
            onToggleShowAll={() => setShowAllThreats((current) => !current)}
          />
        </div>
        <div className="space-y-5">
          <ThreatDistribution items={distribution} />
          <ProtectionTips tips={tips} />
        </div>
      </div>
    </div>
  );
}
