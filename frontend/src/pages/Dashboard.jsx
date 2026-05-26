import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Star, Zap } from "lucide-react";
import { EmailCategoriesChart } from "../components/dashboard/EmailCategoriesChart";
import { EmailTrendChart } from "../components/dashboard/EmailTrendChart";
import { ImportantEmails } from "../components/dashboard/ImportantEmails";
import { InboxSummaryCard } from "../components/dashboard/InboxSummaryCard";
import { KpiCard } from "../components/dashboard/KpiCard";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { ThreatAlerts } from "../components/dashboard/ThreatAlerts";
import { TodaySchedule } from "../components/dashboard/TodaySchedule";
import { TopSenders } from "../components/dashboard/TopSenders";
import { UpcomingReminders } from "../components/dashboard/UpcomingReminders";
import { Button } from "../components/ui/Button";
import { KpiSkeleton } from "../components/ui/Skeleton";
import { api } from "../services/api";

const kpis = [
  { label: "Urgent Emails", value: "2", caption: "Needs immediate action", icon: AlertTriangle, tone: "danger" },
  { label: "Important Emails", value: "5", caption: "High priority emails", icon: Star, tone: "warning" },
  { label: "Threats Detected", value: "1", caption: "Suspicious email", icon: ShieldAlert, tone: "danger" },
  { label: "AI Actions", value: "3", caption: "Suggestions available", icon: Sparkles, tone: "violet" },
];

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

function formatProfileName(value = "") {
  const cleaned = value.split("@")[0].replace(/[._-]+/g, " ").trim();

  if (!cleaned || cleaned.toLowerCase() === "no account connected") {
    return "there";
  }

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
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
  const senderCounts = new Map();

  emails.forEach((email) => {
    const sender = parseSender(email.sender);
    const existing = senderCounts.get(sender.email) || { ...sender, count: 0 };
    existing.count += 1;
    senderCounts.set(sender.email, existing);
  });

  return [...senderCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

function formatCategoryName(category = "others") {
  return category
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Others";
}

function buildCategories(emails = []) {
  const counts = new Map();

  emails.forEach((email) => {
    const category = email.category || "others";
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, value]) => ({ name: formatCategoryName(name), value }))
    .sort((a, b) => b.value - a.value);
}

function formatTrendDay(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildEmailTrend(emails = []) {
  const counts = new Map();

  emails.forEach((email) => {
    const date = new Date(email.received_at);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([key, count]) => ({
      day: formatTrendDay(new Date(`${key}T00:00:00`)),
      emails: count,
    }));
}

function getEmailText(email) {
  return `${email.subject || ""} ${email.snippet || ""} ${email.body || ""}`;
}

function getEmailPreviewText(email) {
  return `${email.subject || ""} ${email.snippet || ""}`;
}

function extractTime(text, fallbackDate) {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)\b/);

  if (match) {
    const minutes = match[2] || "00";
    return `${match[1].padStart(2, "0")}:${minutes} ${match[3].toUpperCase()}`;
  }

  return formatEmailTime(fallbackDate);
}

function extractLocation(text) {
  const lower = text.toLowerCase();

  if (lower.includes("google meet")) return "Google Meet";
  if (lower.includes("zoom")) return "Zoom Meeting";
  if (lower.includes("virtual")) return "Virtual";
  if (lower.includes("conference")) return "Conference Room";
  if (lower.includes("teams")) return "Microsoft Teams";

  return "Email reminder";
}

function buildSchedule(emails = []) {
  const eventPattern = /\b(meeting|interview|standup|call|calendar|webinar)\b/i;

  return emails
    .filter((email) => eventPattern.test(getEmailPreviewText(email)))
    .sort((a, b) => (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))
    .slice(0, 4)
    .map((email) => {
      const text = getEmailPreviewText(email);
      const location = extractLocation(text);

      return {
        id: email.id,
        time: extractTime(text, email.received_at),
        title: email.subject || "Scheduled email",
        location,
        calendar: true,
        virtual: ["Google Meet", "Zoom Meeting", "Virtual", "Microsoft Teams"].includes(location),
      };
    });
}

function extractDueText(text, fallbackDate) {
  const dueMatch = text.match(/\b(today|tomorrow|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?|may \d{1,2}|jun \d{1,2}|jul \d{1,2}|aug \d{1,2}|sep \d{1,2}|oct \d{1,2}|nov \d{1,2}|dec \d{1,2})\b[^.,"\n]{0,28}/i);

  if (dueMatch) {
    return dueMatch[0].trim();
  }

  return formatEmailTime(fallbackDate);
}

function buildReminders(emails = []) {
  const reminderPattern = /(payment|due|deadline|reminder|interview|meeting|follow up|follow-up|action required|confirm)/i;

  return emails
    .filter((email) => reminderPattern.test(getEmailText(email)))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0) || (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))
    .slice(0, 3)
    .map((email) => {
      const text = getEmailText(email);

      return {
        id: email.id,
        title: email.subject || "Email reminder",
        due: extractDueText(text, email.received_at),
        type: /(meeting|interview|calendar|call)/i.test(text) ? "calendar" : "mail",
      };
    });
}

function buildRecentActivity({ emails = [], threats = [], summary = null }) {
  const latestEmail = [...emails].sort((a, b) => (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))[0];
  const importantEmails = emails.filter((email) => email.priority >= 7 || ["important", "urgent"].includes(email.category || ""));
  const latestImportantEmail = importantEmails[0];
  const importantCount = importantEmails.length;
  const activities = [];

  if (emails.length) {
    activities.push({
      icon: CheckCircle2,
      title: `Synced ${emails.length} real emails`,
      meta: latestEmail?.sender || "Latest sync",
      sender: latestEmail?.sender,
      className: "bg-emerald-50 text-success dark:bg-emerald-500/15",
    });
  }

  if (summary?.summary) {
    activities.push({
      icon: Sparkles,
      title: "AI summary generated",
      meta: `${summary.total_today || emails.length || 0} emails analyzed`,
      className: "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark",
    });
  }

  if (threats.length) {
    activities.push({
      icon: ShieldAlert,
      title: `${threats.length} threat${threats.length === 1 ? "" : "s"} detected`,
      meta: threats[0]?.sender || "Threat center updated",
      sender: threats[0]?.sender,
      className: "bg-red-50 text-error dark:bg-red-500/15",
    });
  }

  if (importantCount) {
    activities.push({
      icon: Star,
      title: `${importantCount} important email${importantCount === 1 ? "" : "s"} categorized`,
      meta: latestImportantEmail?.sender || "Priority model updated",
      sender: latestImportantEmail?.sender,
      className: "bg-amber-50 text-warning dark:bg-amber-500/15",
    });
  }

  return activities.slice(0, 4);
}

function mapImportantEmail(email) {
  const urgent = email.priority >= 8;
  const sender = parseSender(email.sender);

  return {
    id: email.id,
    subject: email.subject,
    sender: sender.email,
    senderName: sender.name,
    time: formatEmailTime(email.received_at),
    badge: urgent ? "Urgent" : "Important",
    tone: urgent ? "danger" : "warning",
  };
}

function getThreatTone(threatLevel = "") {
  if (["phishing", "malicious"].includes(threatLevel)) {
    return "bg-red-50 text-error dark:bg-red-500/15";
  }

  return "bg-amber-50 text-warning dark:bg-amber-500/15";
}

function getThreatTitle(email) {
  const level = email.threat_level || "suspicious";

  if (level === "phishing") return "Phishing Email Detected";
  if (level === "malicious") return "Malicious Email Blocked";
  if (level === "spam") return "Spam Email Flagged";
  return email.subject || "Suspicious Email Detected";
}

function mapThreatAlert(email) {
  return {
    id: email.id,
    icon: email.threat_level === "spam" ? AlertTriangle : ShieldAlert,
    title: getThreatTitle(email),
    meta: email.sender || email.subject,
    sender: email.sender,
    className: getThreatTone(email.threat_level),
  };
}

export default function Dashboard({ onNavigate }) {
  const [greeting, setGreeting] = useState(() => getTimeGreeting());
  const [profileName, setProfileName] = useState("there");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [dashboardEmails, setDashboardEmails] = useState([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [syncingInbox, setSyncingInbox] = useState(false);
  const [emailsError, setEmailsError] = useState("");
  const [scheduleEvents, setScheduleEvents] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [dashboardTopSenders, setDashboardTopSenders] = useState([]);
  const [dashboardCategories, setDashboardCategories] = useState([]);
  const [dashboardTrend, setDashboardTrend] = useState([]);
  const [recentActivityItems, setRecentActivityItems] = useState([]);
  const [latestEmails, setLatestEmails] = useState([]);
  const [latestThreats, setLatestThreats] = useState([]);
  const [dashboardThreats, setDashboardThreats] = useState([]);
  const [threatsLoading, setThreatsLoading] = useState(true);
  const [threatsError, setThreatsError] = useState("");
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState(Date.now());
  const [briefingOpen, setBriefingOpen] = useState(false);

  const loadSummary = async () => {
    const data = await api.getEmailSummary();
    setSummary(data);
    setSummaryGeneratedAt(Date.now());
    setSummaryError("");
    return data;
  };

  const handleGenerateBriefing = async () => {
    setBriefingOpen((current) => !current);

    if (!briefingOpen) {
      setSummaryRefreshing(true);

      try {
        await loadSummary();
      } catch (error) {
        setSummaryError("Could not refresh /emails/summary. Check that the backend is running.");
      } finally {
        setSummaryRefreshing(false);
      }
    }
  };

  const loadThreatAlerts = async () => {
    const data = await api.getThreats();
    const mappedThreats = (data?.threats || []).slice(0, 3).map(mapThreatAlert);
    setDashboardThreats(mappedThreats);
    setLatestThreats(data?.threats || []);
    setThreatsError("");
    return data;
  };

  const loadEmailSections = async () => {
    const data = await api.getEmails({ limit: 100 });
    const emails = data?.emails || [];
    const mappedEmails = emails
      .filter((email) => email.priority >= 7 || ["important", "urgent"].includes(email.category || ""))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4)
      .map(mapImportantEmail);

    setDashboardEmails(mappedEmails);
    setScheduleEvents(buildSchedule(emails));
    setUpcomingReminders(buildReminders(emails));
    setDashboardTopSenders(buildTopSenders(emails));
    setDashboardCategories(buildCategories(emails));
    setDashboardTrend(buildEmailTrend(emails));
    setLatestEmails(emails);
    setEmailsError("");
    return data;
  };

  const handleSyncInbox = async () => {
    setSyncingInbox(true);
    setEmailsError("");

    try {
      await api.syncInbox();
      await Promise.all([loadEmailSections(), loadThreatAlerts(), loadSummary()]);
    } catch (error) {
      const user = await api.getCurrentUser().catch(() => null);
      if (user?.reconnect_required || !user?.connected) {
        const data = await api.getGoogleAuthUrl();
        window.location.href = data.auth_url;
        return;
      }

      setEmailsError("Could not sync inbox. Check Gmail connection and backend status.");
    } finally {
      setSyncingInbox(false);
    }
  };

  const handleOpenScheduleEmail = (event) => {
    if (event?.id) {
      sessionStorage.setItem("inboxiq-selected-email-id", event.id);
    }

    onNavigate?.("inbox");
  };

  const handleViewCalendar = () => {
    window.open("https://calendar.google.com/calendar/u/0/r", "_blank", "noopener,noreferrer");
  };

  const openEmailInInbox = (item) => {
    if (item?.id) {
      sessionStorage.setItem("inboxiq-selected-email-id", item.id);
    }

    onNavigate?.("inbox");
  };

  const handleViewImportantEmails = () => {
    sessionStorage.setItem("inboxiq-inbox-tab", "Important");
    onNavigate?.("inbox");
  };

  const handleViewThreatAlerts = () => {
    onNavigate?.("threats");
  };

  const handleOpenReminderEmail = (reminder) => {
    if (reminder?.id) {
      sessionStorage.setItem("inboxiq-selected-email-id", reminder.id);
    }

    onNavigate?.("inbox");
  };

  const handleViewAllReminders = () => {
    sessionStorage.setItem("inboxiq-inbox-query", "reminder OR deadline OR payment OR interview OR meeting");
    onNavigate?.("inbox");
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const user = await api.getCurrentUser();
        if (!ignore) {
          setProfileName(formatProfileName(user?.name || user?.email));
        }
      } catch (error) {
        if (!ignore) {
          setProfileName("there");
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitialEmailSections() {
      try {
        const data = await loadEmailSections();
        const emails = data?.emails || [];

        if (!ignore) {
          setLatestEmails(emails);
          setEmailsError("");
        }
      } catch (error) {
        if (!ignore) {
          setDashboardEmails([]);
          setScheduleEvents([]);
          setUpcomingReminders([]);
          setDashboardTopSenders([]);
          setDashboardCategories([]);
          setDashboardTrend([]);
          setLatestEmails([]);
          setEmailsError("Could not load /emails. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setEmailsLoading(false);
        }
      }
    }

    loadInitialEmailSections();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    let timeoutId;
    let frameId;

    async function loadSecondaryDashboardData() {
      try {
        await loadSummary();
      } catch (error) {
        if (!ignore) {
          setSummary(null);
          setSummaryError("Could not load /emails/summary. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setSummaryLoading(false);
        }
      }

      try {
        const data = await loadThreatAlerts();

        if (!ignore) {
          setLatestThreats(data?.threats || []);
          setThreatsError("");
        }
      } catch (error) {
        if (!ignore) {
          setDashboardThreats([]);
          setLatestThreats([]);
          setThreatsError("Could not load /threats. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setThreatsLoading(false);
        }
      }
    }

    frameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(loadSecondaryDashboardData, 0);
    });

    return () => {
      ignore = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setRecentActivityItems(buildRecentActivity({ emails: latestEmails, threats: latestThreats, summary }));
  }, [latestEmails, latestThreats, summary]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{greeting}, {profileName}!</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here is what is happening with your inbox today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleGenerateBriefing} disabled={summaryRefreshing || summaryLoading}>
            <Sparkles size={15} />
            {summaryRefreshing ? "Generating" : briefingOpen ? "Hide Briefing" : "Generate Briefing"}
          </Button>
          <Button size="sm" onClick={handleSyncInbox} disabled={syncingInbox}>
            <Zap size={15} />
            {syncingInbox ? "Syncing" : "Sync Inbox"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <InboxSummaryCard
            summary={summary?.summary}
            total={summary?.total_today ?? latestEmails.length}
            important={summary?.important_count ?? dashboardEmails.length}
            urgent={summary?.urgent_count ?? 0}
            threats={summary?.threat_count ?? latestThreats.length}
            categoryCounts={summary?.category_counts || {}}
            loading={summaryLoading}
            error={summaryError}
            generatedAt={summaryGeneratedAt}
            briefingOpen={briefingOpen}
          />

          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryLoading || emailsLoading || threatsLoading
              ? Array.from({ length: 4 }).map((_, index) => <KpiSkeleton key={index} />)
              : kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-3">
            <ImportantEmails
              emails={dashboardEmails}
              loading={emailsLoading}
              error={emailsError}
              onOpenEmail={openEmailInInbox}
              onViewAll={handleViewImportantEmails}
            />
            <ThreatAlerts
              alerts={dashboardThreats}
              loading={threatsLoading}
              error={threatsError}
              onOpenAlert={openEmailInInbox}
              onViewAll={handleViewThreatAlerts}
            />
            <RecentActivity items={recentActivityItems} loading={emailsLoading || threatsLoading || summaryLoading} error={emailsError || threatsError || summaryError} />
          </div>
        </div>

        <aside className="grid min-w-0 grid-cols-1 gap-5 lg:grid-rows-[auto_1fr]">
          <TodaySchedule
            events={scheduleEvents}
            loading={emailsLoading}
            error={emailsError}
            onOpenEvent={handleOpenScheduleEmail}
            onViewCalendar={handleViewCalendar}
          />
          <UpcomingReminders
            reminders={upcomingReminders}
            loading={emailsLoading}
            error={emailsError}
            onOpenReminder={handleOpenReminderEmail}
            onViewAll={handleViewAllReminders}
          />
        </aside>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr_0.8fr]">
        <EmailCategoriesChart data={dashboardCategories} loading={emailsLoading} error={emailsError} />
        <EmailTrendChart data={dashboardTrend} loading={emailsLoading} error={emailsError} />
        <TopSenders senders={dashboardTopSenders} loading={emailsLoading} error={emailsError} />
      </div>

    </div>
  );
}
