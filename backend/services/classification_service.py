from backend.utils.constants import CATEGORY_KEYWORDS


class ClassificationService:
    def classify(self, subject: str, body: str, sender: str) -> str:
        text = f"{subject} {body} {sender}".lower()
        best_category = "personal"
        best_hits = 0
        for category, keywords in CATEGORY_KEYWORDS.items():
            hits = sum(1 for keyword in keywords if keyword in text)
            if hits > best_hits:
                best_category = category
                best_hits = hits
        return best_category

    def priority(self, subject: str, body: str, threat_level: str) -> int:
        text = f"{subject} {body}".lower()
        score = 5
        if any(term in text for term in ["urgent", "tomorrow", "deadline", "interview", "payment due"]):
            score += 3
        if any(term in text for term in ["confirm", "meeting", "review", "shortlisted"]):
            score += 1
        if threat_level in {"phishing", "malicious"}:
            score += 2
        return min(score, 10)

    def suggest_actions(self, category: str, priority: int, threat_level: str) -> list[str]:
        if threat_level in {"phishing", "malicious"}:
            return ["Do not click links", "Report as phishing", "Verify sender independently"]
        actions = []
        if priority >= 8:
            actions.append("Respond today")
        if category in {"recruitment", "meetings", "education", "projects"}:
            actions.append("Add to calendar or task list")
        if category == "finance":
            actions.append("Verify payment details")
        return actions or ["No immediate action required"]
