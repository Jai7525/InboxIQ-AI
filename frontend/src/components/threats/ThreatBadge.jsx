import { Badge } from "../ui/Badge";

const levelTones = {
  Low: "success",
  Medium: "warning",
  High: "danger",
  Critical: "danger",
  Phishing: "danger",
  Spam: "warning",
  "Suspicious Link": "warning",
  Other: "neutral",
};

export function ThreatBadge({ level }) {
  return <Badge tone={levelTones[level] || "neutral"}>{level}</Badge>;
}
