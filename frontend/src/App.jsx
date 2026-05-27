import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Skeleton } from "./components/ui/Skeleton";
import { navItems } from "./utils/constants";

const pageRegistry = {
  dashboard: lazy(() => import("./pages/Dashboard")),
  inbox: lazy(() => import("./pages/Inbox")),
  search: lazy(() => import("./pages/SemanticSearch")),
  chat: lazy(() => import("./pages/AIChat")),
  threats: lazy(() => import("./pages/ThreatCenter")),
  analytics: lazy(() => import("./pages/Analytics")),
  settings: lazy(() => import("./pages/Settings")),
  privacy: lazy(() => import("./pages/Privacy")),
  terms: lazy(() => import("./pages/Terms")),
};

const pagePaths = {
  dashboard: "/",
  inbox: "/inbox",
  search: "/search",
  chat: "/chat",
  threats: "/threats",
  analytics: "/analytics",
  settings: "/settings",
  privacy: "/privacy",
  terms: "/terms",
};

const publicPages = new Set(["privacy", "terms"]);

const pathPages = Object.entries(pagePaths).reduce((routes, [page, path]) => {
  routes[path] = page;
  return routes;
}, {});

function getPageFromPath(pathname) {
  return pathPages[pathname] || "dashboard";
}

function PageFallback() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname));
  const Page = pageRegistry[activePage] || pageRegistry.dashboard;
  const title = useMemo(
    () => navItems.find((item) => item.href === activePage)?.label || "Dashboard",
    [activePage],
  );

  useEffect(() => {
    const handlePopState = () => {
      setActivePage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (page) => {
    const nextPath = pagePaths[page] || "/";

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setActivePage(pageRegistry[page] ? page : "dashboard");
  };

  if (publicPages.has(activePage)) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Page />
      </Suspense>
    );
  }

  return (
    <DashboardLayout activePage={activePage} onNavigate={handleNavigate} title={title}>
      <Suspense fallback={<PageFallback />}>
        <Page onNavigate={handleNavigate} />
      </Suspense>
    </DashboardLayout>
  );
}
