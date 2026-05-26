from datetime import datetime, timezone

from backend.models.schemas import EmailItem
from backend.services.classification_service import ClassificationService
from backend.services.threat_detection import ThreatDetectionService
from backend.utils.helpers import normalize_whitespace


class EmailProcessor:
    def __init__(self) -> None:
        self.classifier = ClassificationService()
        self.threat_detector = ThreatDetectionService()

    def process(self, raw_email: dict) -> EmailItem:
        subject = normalize_whitespace(raw_email.get("subject", "No subject"))
        body = normalize_whitespace(raw_email.get("body", ""))
        sender = raw_email.get("sender", "unknown@example.com")
        threat = self.threat_detector.analyze_text(subject, body, sender)
        category = self.classifier.classify(subject, body, sender)
        priority = self.classifier.priority(subject, body, threat.threat_level)

        return EmailItem(
            id=str(raw_email.get("id")),
            account_email=raw_email.get("account_email") or raw_email.get("recipient"),
            thread_id=raw_email.get("thread_id"),
            sender=sender,
            recipient=raw_email.get("recipient"),
            subject=subject,
            snippet=raw_email.get("snippet") or body[:160],
            body=body,
            received_at=raw_email.get("received_at") or datetime.now(timezone.utc),
            category=category,
            priority=priority,
            threat_level=threat.threat_level,
            threat_score=threat.threat_score,
            suggested_actions=self.classifier.suggest_actions(category, priority, threat.threat_level),
            metadata={"threat_reasons": threat.reasons, "suspicious_urls": threat.suspicious_urls},
        )
