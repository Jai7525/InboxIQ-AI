from backend.models.schemas import ThreatAnalysisResponse
from backend.utils.helpers import extract_urls


class ThreatDetectionService:
    suspicious_terms = {
        "verify now",
        "account suspended",
        "click here",
        "urgent action",
        "password",
        "bank account",
        "limited time",
        "restore access",
    }

    risky_tlds = {".ru", ".cn", ".zip", ".mov"}

    def analyze_text(self, subject: str, body: str, sender: str) -> ThreatAnalysisResponse:
        text = f"{subject} {body}".lower()
        urls = extract_urls(body)
        reasons: list[str] = []
        score = 0.0

        for term in self.suspicious_terms:
            if term in text:
                score += 0.15
                reasons.append(f"Contains suspicious phrase: {term}")

        for url in urls:
            if any(tld in url.lower() for tld in self.risky_tlds):
                score += 0.25
                reasons.append(f"URL uses risky domain pattern: {url}")
            if "@" in url or url.count("-") >= 3:
                score += 0.15
                reasons.append(f"URL has suspicious formatting: {url}")

        if sender.endswith(".ru") or "alert" in sender.lower() or "security" in sender.lower():
            score += 0.1
            reasons.append("Sender resembles an alert or unusual domain.")

        score = min(score, 1.0)
        level = "safe"
        if score >= 0.75:
            level = "malicious"
        elif score >= 0.55:
            level = "phishing"
        elif score >= 0.3:
            level = "suspicious"
        elif "sale" in text or "discount" in text:
            level = "spam"
            score = max(score, 0.2)

        return ThreatAnalysisResponse(
            threat_level=level,
            threat_score=round(score, 2),
            reasons=reasons or ["No obvious phishing indicators found."],
            suspicious_urls=urls,
        )
