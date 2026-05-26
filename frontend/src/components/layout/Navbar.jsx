import { useEffect, useRef, useState } from "react";
import { Bell, Bot, CheckCircle2, Command, Menu, Search, ShieldAlert, Sparkles, Star } from "lucide-react";
import { api } from "../../services/api";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { Input } from "../ui/Input";
import { ListSkeleton } from "../ui/Skeleton";

export function Navbar({ title, onOpenSidebar, onNavigate }) {
  const [profile, setProfile] = useState({ connected: false, name: "InboxIQ", email: "" });
  const [query, setQuery] = useState("");
  const [threatCount, setThreatCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    async function loadNavbarData() {
      try {
        const [user, threats, emails, summary] = await Promise.all([
          api.getCurrentUser(),
          api.getThreats(),
          api.getEmails({ limit: 100 }),
          api.getEmailSummary(),
        ]);
        const emailItems = emails?.emails || [];
        const threatItems = threats?.threats || [];

        if (!ignore) {
          setProfile({
            connected: Boolean(user?.connected),
            name: user?.name || "No account connected",
            email: user?.email || (user?.reconnect_required ? "Reconnect Gmail account" : "Connect Google account"),
          });
          setThreatCount(threats?.total ?? threatItems.length ?? 0);
          setNotifications(buildNotifications({ emails: emailItems, threats: threatItems, summary }));
          setNotificationsLoading(false);
        }
      } catch (error) {
        if (!ignore) {
          setProfile({ connected: false, name: "Backend unavailable", email: "Check API connection" });
          setThreatCount(0);
          setNotifications([]);
          setNotificationsLoading(false);
        }
      }
    }

    loadNavbarData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();

    if (!nextQuery) {
      searchRef.current?.focus();
      return;
    }

    sessionStorage.setItem("inboxiq-search-query", nextQuery);
    onNavigate?.("search");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#F8FAFC]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0F172A]/90 sm:px-6">
      <div className="flex items-center gap-3">
        <IconButton label="Open navigation" className="lg:hidden" onClick={onOpenSidebar}>
          <Menu size={19} />
        </IconButton>

        <h1 className="min-w-0 flex-1 truncate text-base font-bold text-slate-950 dark:text-white md:hidden">{title}</h1>

        <div className="hidden min-w-0 flex-1 md:block">
          <form className="relative max-w-2xl" onSubmit={handleSearch}>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              ref={searchRef}
              className="pl-10 pr-12"
              placeholder="Search emails, people, projects, or anything..."
              aria-label="Global search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-400">
              <Command size={13} /> K
            </span>
          </form>
        </div>

        <Button className="hidden sm:inline-flex" size="sm" onClick={() => onNavigate?.("chat")}>
          <Bot size={15} />
          AI Assistant
        </Button>

        <div className="relative" ref={notificationsRef}>
          <IconButton
            label={`${notifications.length || threatCount} recent activity notifications`}
            className="relative"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={19} />
            {threatCount ? (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-error dark:border-[#0F172A]" />
            ) : null}
          </IconButton>

          {notificationsOpen ? (
            <div className="absolute right-0 top-12 z-30 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-[#0B1120] dark:shadow-glass">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Recent Activity</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Live inbox updates</p>
                </div>
                {threatCount ? <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-error dark:bg-red-500/15">{threatCount}</span> : null}
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {notificationsLoading ? (
                  <ListSkeleton rows={4} />
                ) : notifications.length ? (
                  notifications.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        type="button"
                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                        onClick={() => {
                          setNotificationsOpen(false);
                          if (item.target) onNavigate?.(item.target);
                        }}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.className}`}>
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.meta}</span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">No recent activity yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <Avatar name={profile.name} />
          <div className="max-w-32">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{profile.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
          </div>
        </div>
      </div>
      <span className="sr-only">{title}</span>
    </header>
  );
}

function buildNotifications({ emails = [], threats = [], summary = null }) {
  const latestEmail = [...emails].sort((a, b) => (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))[0];
  const importantCount = emails.filter((email) => email.priority >= 7 || ["important", "urgent"].includes(email.category || "")).length;
  const items = [];

  if (emails.length) {
    items.push({
      icon: CheckCircle2,
      title: `Synced ${emails.length} real emails`,
      meta: latestEmail ? formatNotificationTime(latestEmail.received_at) : "Latest sync",
      target: "inbox",
      className: "bg-emerald-50 text-success dark:bg-emerald-500/15",
    });
  }

  if (summary?.summary) {
    items.push({
      icon: Sparkles,
      title: "AI summary generated",
      meta: `${summary.total_today || emails.length || 0} emails analyzed`,
      target: "dashboard",
      className: "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark",
    });
  }

  if (threats.length) {
    items.push({
      icon: ShieldAlert,
      title: `${threats.length} threat${threats.length === 1 ? "" : "s"} detected`,
      meta: threats[0]?.sender || "Threat center updated",
      target: "threats",
      className: "bg-red-50 text-error dark:bg-red-500/15",
    });
  }

  if (importantCount) {
    items.push({
      icon: Star,
      title: `${importantCount} important email${importantCount === 1 ? "" : "s"} categorized`,
      meta: "Priority model updated",
      target: "inbox",
      className: "bg-amber-50 text-warning dark:bg-amber-500/15",
    });
  }

  return items.slice(0, 4);
}

function formatNotificationTime(value) {
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
