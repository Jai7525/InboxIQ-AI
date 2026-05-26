import { Mail, ShieldCheck } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function AccountCard({ user, onManageAccount, onLogout }) {
  const name = user?.name || "No account connected";
  const email = user?.email || "Connect Google account";
  const connected = Boolean(user?.connected);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Avatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-950 dark:text-white">{name}</p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {connected ? (
              <>
                <Badge tone="success">
                  <ShieldCheck size={13} />
                  Verified
                </Badge>
                <Badge tone="primary">
                  <Mail size={13} />
                  Gmail
                </Badge>
              </>
            ) : (
              <Badge tone="warning">Not connected</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <Button variant="secondary" size="sm" className="w-full" onClick={onManageAccount}>
          {connected ? "Manage Account" : "Connect Gmail"}
        </Button>
        {connected ? (
          <Button variant="ghost" size="sm" className="w-full" onClick={onLogout}>
            Logout
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
