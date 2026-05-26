import {
  BarChart3,
  Bot,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

export const appMeta = {
  name: "InboxIQ AI",
  tagline: "AI Inbox Intelligence",
};

export const navItems = [
  { label: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { label: "Inbox Intelligence", href: "inbox", icon: Inbox },
  { label: "Semantic Search", href: "search", icon: Search },
  { label: "AI Chat Assistant", href: "chat", icon: Bot },
  { label: "Threat Center", href: "threats", icon: ShieldCheck },
  { label: "Analytics", href: "analytics", icon: BarChart3 },
  { label: "Settings", href: "settings", icon: Settings },
];

export const categoryColors = ["#2563EB", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#64748B"];

export const themeColors = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    sidebar: "#FFFFFF",
    card: "rgba(255,255,255,0.95)",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    text: "#0F172A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    border: "#E2E8F0",
  },
  dark: {
    background: "#0F172A",
    surface: "#111827",
    sidebar: "#0B1120",
    card: "rgba(17,24,39,0.75)",
    primary: "#4098F8",
    secondary: "#8B5CF6",
    text: "#FFFFFF",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    border: "rgba(255,255,255,0.08)",
  },
};

export const userProfile = {
  name: "Aditya Singh",
  email: "aditya@gmail.com",
  initials: "AS",
};
