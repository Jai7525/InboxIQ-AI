import { Card } from "../ui/Card";
import { ListSkeleton } from "../ui/Skeleton";
import { StateMessage } from "../ui/StateMessage";
import { EmailListItem } from "./EmailListItem";

export function EmailList({ emails, selectedEmailId, onSelectEmail, loading = false, error = "" }) {
  if (error) {
    return (
      <Card className="p-5">
        <StateMessage type="error" title="Inbox unavailable" description={error} />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-5">
        <ListSkeleton rows={6} />
      </Card>
    );
  }

  if (!emails.length) {
    return (
      <Card className="p-5">
        <StateMessage type="empty" title="No emails found" description="Try changing the filters, or sync your inbox to load messages." />
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-200 overflow-hidden dark:divide-white/10">
      {emails.map((email) => (
        <EmailListItem
          key={email.id}
          email={email}
          selected={email.id === selectedEmailId}
          onSelect={() => onSelectEmail(email)}
        />
      ))}
    </Card>
  );
}
