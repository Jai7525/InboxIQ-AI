import { useState } from "react";
import { X } from "lucide-react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { IconButton } from "../ui/IconButton";

export function DashboardLayout({ activePage, onNavigate, title, children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleNavigate = (page) => {
    onNavigate(page);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 dark:bg-[#0F172A] dark:text-white">
      <div className="flex min-h-screen">
        <Sidebar activePage={activePage} onNavigate={handleNavigate} />

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              aria-label="Close navigation"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative h-full w-72 bg-white shadow-soft dark:bg-[#0B1120] dark:shadow-glass">
              <IconButton
                label="Close navigation"
                className="absolute right-3 top-3 z-10"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X size={18} />
              </IconButton>
              <Sidebar activePage={activePage} onNavigate={handleNavigate} mobile />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <Navbar title={title} onOpenSidebar={() => setMobileSidebarOpen(true)} onNavigate={handleNavigate} />
          <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
