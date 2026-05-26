import { useState } from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";

export function ProtectionTips({ tips }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <Card className="p-5">
      <CardHeader title="Protection Tips" action={<ShieldCheck size={18} className="text-success" />} />
      <div className="mt-4 space-y-3">
        {tips.map((tip) => (
          <div key={tip.title} className="subtle-panel flex items-start gap-3 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-primary-light dark:bg-sky-500/15 dark:text-primary-dark">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{tip.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
      {helpOpen ? (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-slate-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-slate-300">
          <p className="font-semibold text-slate-950 dark:text-white">What to do with a flagged email</p>
          <p className="mt-2">Open the threat from this page, verify the sender, avoid links inside the email, then move confirmed phishing or spam messages in Gmail.</p>
        </div>
      ) : null}
      <Button variant="primary" size="md" className="mt-4 w-full" onClick={() => setHelpOpen((isOpen) => !isOpen)}>
        <HelpCircle size={16} />
        {helpOpen ? "Hide Help" : "View Help"}
      </Button>
    </Card>
  );
}
