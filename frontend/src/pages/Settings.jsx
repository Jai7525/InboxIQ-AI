import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Mail, Shield, SlidersHorizontal } from "lucide-react";
import { AccountCard } from "../components/settings/AccountCard";
import { IntegrationCard } from "../components/settings/IntegrationCard";
import { SettingsTabs } from "../components/settings/SettingsTabs";
import { ThemeToggle } from "../components/settings/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { TextSkeleton } from "../components/ui/Skeleton";
import { StateMessage } from "../components/ui/StateMessage";
import { api } from "../services/api";

const tabs = ["Profile", "Integrations", "Preferences", "Security"];
const PREFERENCES_KEY = "inboxiq-settings-preferences";

const defaultPreferences = {
  smartPrioritization: true,
  threatAutoQuarantine: false,
  dailyDigest: true,
};

function loadPreferences() {
  try {
    return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}") };
  } catch (error) {
    return defaultPreferences;
  }
}

function buildIntegrations(user) {
  const connected = Boolean(user?.connected);
  const email = user?.email || "No Gmail account connected";

  return [
    {
      id: "gmail",
      name: "Gmail Account",
      detail: email,
      icon: Mail,
      connected,
      actionLabel: connected ? "Manage" : "Connect",
    },
    {
      id: "calendar",
      name: "Google Calendar",
      detail: connected ? "Open your connected Google Calendar" : "Connect Gmail first",
      icon: CheckCircle2,
      connected: false,
      disabled: !connected,
      actionLabel: "Open",
    },
    {
      id: "drive",
      name: "Google Drive",
      detail: connected ? "Open Google Drive for attachments" : "Connect Gmail first",
      icon: Cloud,
      connected: false,
      disabled: !connected,
      actionLabel: "Open",
    },
  ];
}

function withGoogleAccount(url, email) {
  if (!email) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}authuser=${encodeURIComponent(email)}`;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Integrations");
  const [user, setUser] = useState({ connected: false, name: "No account connected", email: null });
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [preferences, setPreferences] = useState(loadPreferences);

  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const data = await api.getCurrentUser();

        if (!ignore) {
          setUser(data || { connected: false, name: "No account connected", email: null });
          setUserError("");
        }
      } catch (error) {
        if (!ignore) {
          setUser({ connected: false, name: "No account connected", email: null });
          setUserError("Could not load /auth/me. Check that the backend is running.");
        }
      } finally {
        if (!ignore) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  const connectGmail = async () => {
    try {
      const data = await api.getGoogleAuthUrl();
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      setActionMessage("Could not start Google connection. Check the backend auth route.");
    }
  };

  const handleManageAccount = () => {
    if (!user.connected) {
      connectGmail();
      return;
    }

    window.open(withGoogleAccount("https://myaccount.google.com/", user.email), "_blank", "noopener,noreferrer");
  };

  const handleLogout = async () => {
    try {
      await api.logout(user.email);
      setUser({ connected: false, name: "No account connected", email: null });
      setActionMessage("Gmail account disconnected.");
    } catch (error) {
      setActionMessage("Could not logout. Check the backend auth route.");
    }
  };

  const handleIntegrationAction = (integration) => {
    if (integration.id === "gmail") {
      if (integration.connected) {
        handleManageAccount();
      } else {
        connectGmail();
      }
      return;
    }

    const externalLinks = {
      calendar: "https://calendar.google.com/calendar/u/0/r",
      drive: "https://drive.google.com/drive/u/0/my-drive",
    };

    if (externalLinks[integration.id]) {
      window.open(withGoogleAccount(externalLinks[integration.id], user.email), "_blank", "noopener,noreferrer");
      setActionMessage(`Opened ${integration.name}.`);
      return;
    }

    setActionMessage(`${integration.name} integration is not configured yet.`);
  };

  const togglePreference = (key) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const integrations = buildIntegrations(user);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account and preferences.</p>
      </div>

      <SettingsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {actionMessage ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {activeTab === "Profile" ? (
            <Card className="p-5">
              {loadingUser ? (
                <div>
                  <TextSkeleton lines={1} className="w-40" />
                  <TextSkeleton lines={3} className="mt-5 max-w-md" />
                </div>
              ) : userError ? (
                <StateMessage type="error" title="Account unavailable" description={userError} />
              ) : (
                <div>
                  <h2 className="text-sm font-bold text-slate-950 dark:text-white">Account Details</h2>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>Name: <span className="font-semibold text-slate-950 dark:text-white">{user.name || "No account connected"}</span></p>
                    <p>Email: <span className="font-semibold text-slate-950 dark:text-white">{user.email || "Not connected"}</span></p>
                    <p>Status: <span className="font-semibold text-slate-950 dark:text-white">{user.connected ? "Connected" : "Not connected"}</span></p>
                  </div>
                  <Button className="mt-5" variant="secondary" size="sm" onClick={handleManageAccount}>
                    {user.connected ? "Open Google Account" : "Connect Gmail"}
                  </Button>
                </div>
              )}
            </Card>
          ) : null}

          {activeTab === "Integrations" ? (
            <Card className="divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} onAction={handleIntegrationAction} />
              ))}
            </Card>
          ) : null}

          {activeTab === "Preferences" ? (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="text-primary-light dark:text-primary-dark" size={20} />
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">AI Preferences</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <label className="flex items-center justify-between gap-4">
                  Smart prioritization
                  <input type="checkbox" checked={preferences.smartPrioritization} onChange={() => togglePreference("smartPrioritization")} className="h-4 w-4 accent-indigo-600" />
                </label>
                <label className="flex items-center justify-between gap-4">
                  Threat auto-quarantine
                  <input type="checkbox" checked={preferences.threatAutoQuarantine} onChange={() => togglePreference("threatAutoQuarantine")} className="h-4 w-4 accent-indigo-600" />
                </label>
                <label className="flex items-center justify-between gap-4">
                  Daily AI digest
                  <input type="checkbox" checked={preferences.dailyDigest} onChange={() => togglePreference("dailyDigest")} className="h-4 w-4 accent-indigo-600" />
                </label>
              </div>
            </Card>
          ) : null}

          {activeTab === "Security" ? (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <Shield className="text-success" size={20} />
                <h2 className="text-sm font-bold text-slate-950 dark:text-white">Security</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                InboxIQ uses your connected Gmail data for summaries, search, threat review, and chat answers. You can disconnect Gmail from this page at any time.
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <AccountCard user={user} onManageAccount={handleManageAccount} onLogout={handleLogout} />
          <ThemeToggle />

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Shield className="text-success" size={20} />
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Security</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              RAG search uses indexed email metadata and citation references. Sensitive integrations remain user-controlled.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
