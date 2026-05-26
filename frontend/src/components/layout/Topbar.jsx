import { Bell, Bot, Command, Menu, Search } from "lucide-react";
import { userProfile } from "../../utils/constants";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function Topbar({ title }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#F8FAFC]/90 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0F172A]/90 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu size={19} />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input className="pl-10 pr-12" placeholder="Search emails, people, projects, or anything..." aria-label="Global search" />
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-slate-400">
              <Command size={13} /> K
            </span>
          </div>
        </div>

        <Button className="hidden sm:inline-flex" size="sm">
          <Bot size={15} />
          AI Assistant
        </Button>

        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-error dark:border-[#0F172A]" />
        </button>

        <div className="hidden items-center gap-3 sm:flex">
          <Avatar name={userProfile.name} />
          <div className="max-w-32">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userProfile.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{userProfile.email}</p>
          </div>
        </div>
      </div>
      <h1 className="sr-only">{title}</h1>
    </header>
  );
}
