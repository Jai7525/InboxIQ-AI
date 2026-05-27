import { useEffect, useState } from "react";
import { LogOut, Moon, Sun, Zap } from "lucide-react";
import inboxIqMark from "../../assets/inboxiq-mark.png";
import { appMeta, navItems } from "../../utils/constants";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../services/api";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";

export function Sidebar({ activePage, onNavigate, mobile = false }) {
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState({ connected: false, name: "InboxIQ", email: "" });
  const [syncInfo, setSyncInfo] = useState({ loading: true, syncing: false, total: 0, lastSynced: "Loading" });

  const loadSidebarData = async () => {
    try {
      const [user, emailData] = await Promise.all([api.getCurrentUser(), api.getEmails({ limit: 100 })]);
      const emails = emailData?.emails || [];
      const latestEmail = [...emails].sort((a, b) => (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))[0];

      setProfile({
        connected: Boolean(user?.connected),
        name: user?.name || "Connected account",
        email: user?.email || "",
        reconnectRequired: Boolean(user?.reconnect_required),
      });
      setSyncInfo({
        loading: false,
        syncing: false,
        total: emailData?.total ?? emails.length,
        lastSynced: latestEmail ? formatSyncTime(latestEmail.received_at) : "No sync yet",
      });
    } catch (error) {
      setProfile({ connected: false, name: "Backend unavailable", email: "" });
      setSyncInfo({ loading: false, syncing: false, total: 0, lastSynced: "Unavailable" });
    }
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [user, emailData] = await Promise.all([api.getCurrentUser(), api.getEmails({ limit: 100 })]);
        const emails = emailData?.emails || [];
        const latestEmail = [...emails].sort((a, b) => (Date.parse(b.received_at) || 0) - (Date.parse(a.received_at) || 0))[0];

        if (!ignore) {
          setProfile({
            connected: Boolean(user?.connected),
            name: user?.name || "Connected account",
            email: user?.email || "",
            reconnectRequired: Boolean(user?.reconnect_required),
          });
          setSyncInfo({
            loading: false,
            syncing: false,
            total: emailData?.total ?? emails.length,
            lastSynced: latestEmail ? formatSyncTime(latestEmail.received_at) : "No sync yet",
          });
        }
      } catch (error) {
        if (!ignore) {
          setProfile({ connected: false, name: "Backend unavailable", email: "" });
          setSyncInfo({ loading: false, syncing: false, total: 0, lastSynced: "Unavailable" });
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSync = async () => {
    if (!profile.connected) {
      const data = await api.getGoogleAuthUrl();
      window.location.href = data.auth_url;
      return;
    }

    setSyncInfo((current) => ({ ...current, syncing: true }));

    try {
      await api.syncInbox();
      await loadSidebarData();
    } catch (error) {
      setSyncInfo((current) => ({ ...current, syncing: false, lastSynced: "Sync failed" }));
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem("inboxiq-auth-user");
      window.location.href = "/";
    }
  };

  return (
    <aside
      className={`shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-white/10 dark:bg-[#0B1120] ${
        mobile ? "flex h-full w-full" : "hidden min-h-screen w-64 lg:flex"
      }`}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] shadow-sm ring-1 ring-slate-200/80 dark:ring-white/10">
          <img
            src={inboxIqMark}
            alt="InboxIQ AI"
            className="h-full w-full rounded-[13px] object-cover"
          />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-950 dark:text-white">{appMeta.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{appMeta.tagline}</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.href;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                active
                  ? "bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-4 pb-2">
        <div className="subtle-panel p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-success">
            <span className={`h-2 w-2 rounded-full ${profile.connected ? "bg-success" : "bg-slate-400"}`} />
            {profile.connected ? "Connected" : profile.reconnectRequired ? "Reconnect required" : "Not connected"}
          </div>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-3 text-slate-500 dark:text-slate-400">
              <dt>Last synced</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-200">{syncInfo.loading ? "Loading" : syncInfo.lastSynced}</dd>
            </div>
            <div className="flex justify-between gap-3 text-slate-500 dark:text-slate-400">
              <dt>Emails fetched</dt>
              <dd className="font-semibold text-slate-700 dark:text-slate-200">{syncInfo.loading ? "..." : syncInfo.total.toLocaleString()}</dd>
            </div>
          </dl>
          <Button className="mt-4 w-full" size="sm" onClick={handleSync} disabled={syncInfo.syncing}>
            <Zap size={14} />
            {profile.connected ? (syncInfo.syncing ? "Syncing" : "Sync Now") : "Reconnect Gmail"}
          </Button>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={profile.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{profile.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email || "Connect Google account"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Moon size={16} /> : <Sun size={16} />}
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
          <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${isDark ? "bg-primary-dark" : "bg-primary-light"}`}>
            <span className={`h-4 w-4 rounded-full bg-white transition ${isDark ? "translate-x-5" : ""}`} />
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function formatSyncTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Synced";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
