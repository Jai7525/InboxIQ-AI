import { useEffect, useState } from "react";
import { BarChart3, Bot, Inbox, ShieldAlert } from "lucide-react";
import { AnalyticsKpi } from "../components/analytics/AnalyticsKpi";
import { CategoryBreakdown } from "../components/analytics/CategoryBreakdown";
import { EmailTrendChart } from "../components/analytics/EmailTrendChart";
import { TopSenderStats } from "../components/analytics/TopSenderStats";
import { api } from "../services/api";

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function mapCategories(categories = {}) {
  return Object.entries(categories)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .filter((category) => category.value > 0);
}

function mapStats(overview) {
  const categoryCount = Object.keys(overview.categories || {}).length;

  return [
    { label: "Total Emails", value: formatNumber(overview.total_emails), caption: "Overview", icon: Inbox, tone: "primary" },
    { label: "Urgent Emails", value: formatNumber(overview.urgent_emails), caption: "Overview", icon: Bot, tone: "success" },
    { label: "Threats Detected", value: formatNumber(overview.threat_alerts), caption: "Overview", icon: ShieldAlert, tone: "danger" },
    { label: "Categories", value: formatNumber(categoryCount), caption: "Overview", icon: BarChart3, tone: "warning" },
  ];
}

function formatTrendDay(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildEmailTrend(emails = []) {
  const counts = new Map();
  const today = new Date();

  Array.from({ length: 7 }).forEach((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    counts.set(key, { emails: 0, threats: 0, urgent: 0 });
  });

  emails.forEach((email) => {
    const date = new Date(email.received_at);
    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    if (!counts.has(key)) return;

    const item = counts.get(key);
    item.emails += 1;
    if (isThreatEmail(email)) item.threats += 1;
    if ((email.priority || 0) >= 8 || email.category === "urgent") item.urgent += 1;
  });

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => ({
      day: formatTrendDay(new Date(`${key}T00:00:00`)),
      ...item,
    }));
}

function isThreatEmail(email = {}) {
  const level = `${email.threat_level || ""}`.toLowerCase();
  return level && level !== "safe" && (["spam", "phishing", "malicious"].includes(level) || Number(email.threat_score || 0) >= 0.6);
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

function buildTopSenders(emails = []) {
  const senders = new Map();

  emails.forEach((email) => {
    const sender = parseSender(email.sender);
    const existing = senders.get(sender.email) || { ...sender, count: 0 };
    existing.count += 1;
    senders.set(sender.email, existing);
  });

  return [...senders.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((sender) => ({
      ...sender,
      change: "Live",
    }));
}

export default function Analytics() {
  const [stats, setStats] = useState(mapStats({ categories: {} }));
  const [categories, setCategories] = useState([]);
  const [emailTrend, setEmailTrend] = useState([]);
  const [topSenders, setTopSenders] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [emailAnalyticsLoading, setEmailAnalyticsLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [emailAnalyticsError, setEmailAnalyticsError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadAnalyticsOverview() {
      try {
        const overview = await api.getAnalyticsOverview();
        const nextCategories = mapCategories(overview?.categories || {});

        if (!ignore) {
          setStats(mapStats(overview || {}));
          setCategories(nextCategories);
          setOverviewError("");
        }
      } catch (error) {
        if (!ignore) {
          setStats(mapStats({ categories: {} }));
          setCategories([]);
          setOverviewError("Could not load /analytics/overview. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setOverviewLoading(false);
        }
      }
    }

    loadAnalyticsOverview();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadEmailAnalytics() {
      try {
        const data = await api.getEmails({ limit: 100 });
        const emails = data?.emails || [];
        const nextTrend = buildEmailTrend(emails);
        const nextTopSenders = buildTopSenders(emails);

        if (!ignore) {
          setEmailTrend(nextTrend);
          setTopSenders(nextTopSenders);
          setEmailAnalyticsError("");
        }
      } catch (error) {
        if (!ignore) {
          setEmailTrend([]);
          setTopSenders([]);
          setEmailAnalyticsError("Could not load /emails for trend and sender analytics.");
        }
      } finally {
        if (!ignore) {
          setEmailAnalyticsLoading(false);
        }
      }
    }

    loadEmailAnalytics();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Insights and trends from your inbox.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AnalyticsKpi key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <EmailTrendChart data={emailTrend} loading={emailAnalyticsLoading} error={emailAnalyticsError} />
        <CategoryBreakdown categories={categories} loading={overviewLoading} error={overviewError} />
      </div>

      <TopSenderStats senders={topSenders} loading={emailAnalyticsLoading} error={emailAnalyticsError} />
    </div>
  );
}
