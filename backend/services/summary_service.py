from collections import Counter
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import httpx

from backend.config import settings
from backend.models.schemas import InboxSummaryResponse
from backend.services.supabase_service import SupabaseService
from backend.utils.helpers import load_prompt


class SummaryService:
    def __init__(self) -> None:
        self.supabase_service = SupabaseService()
        self.local_timezone = ZoneInfo(settings.LOCAL_TIMEZONE)

    async def generate_daily_summary(self, account_email: str) -> InboxSummaryResponse:
        emails = await self.supabase_service.list_emails(limit=100, account_email=account_email)
        today_emails = [email for email in emails if self._is_today(email.received_at)]
        briefing_emails = today_emails or emails[:25]
        category_counts = dict(Counter(email.category for email in briefing_emails))
        urgent = [email for email in briefing_emails if email.priority >= 8]
        important = [email for email in briefing_emails if email.priority >= 7]
        threats = [
            email
            for email in briefing_emails
            if email.threat_level in {"suspicious", "spam", "phishing", "malicious"}
        ]

        highlights = [
            f"{len(urgent)} urgent emails detected",
            f"{category_counts.get('recruitment', 0)} recruitment emails found",
            f"{category_counts.get('finance', 0)} payment or finance emails found",
            f"{len(threats)} suspicious or threat emails identified",
            f"{category_counts.get('promotions', 0)} promotional emails filtered",
        ]
        summary = await self._generate_groq_summary(briefing_emails, highlights, category_counts)
        return InboxSummaryResponse(
            summary=summary,
            highlights=highlights,
            urgent_count=len(urgent),
            threat_count=len(threats),
            total_today=len(briefing_emails),
            important_count=len(important),
            category_counts=category_counts,
        )

    def _is_today(self, value: datetime) -> bool:
        current = value
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        return current.astimezone(self.local_timezone).date() == datetime.now(self.local_timezone).date()

    async def _generate_groq_summary(self, emails, highlights: list[str], category_counts: dict[str, int]) -> str:
        if not emails:
            return "Today's Inbox Summary\n\nNo emails have been synced for today yet."

        fallback = self._fallback_summary(highlights)
        if not settings.GROQ_API_KEY or settings.MOCK_MODE:
            return fallback

        context = "\n".join(
            (
                f"- Subject: {email.subject}; Sender: {email.sender}; "
                f"Category: {email.category}; Priority: {email.priority}; "
                f"Threat: {email.threat_level}; Summary: {(email.snippet or email.body)[:180]}"
            )
            for email in emails[:30]
        )
        prompt = (
            f"{load_prompt('inbox_summary.txt')}\n\n"
            f"Today's category counts: {category_counts}\n\n"
            f"Emails:\n{context}\n\n"
            "Return the answer as 'Today's Inbox Summary' followed by concise bullets. "
            "Only mention categories or sections that have at least one email. "
            "Never write 'None', '0', or empty sections. "
            "Prefer bullets like '1 recruitment email' or '1 suspicious email'."
        )
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2,
                    },
                )
                response.raise_for_status()
                data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception:
            return fallback

    def _fallback_summary(self, highlights: list[str]) -> str:
        bullets = "\n".join(f"- {highlight}" for highlight in highlights)
        return f"Today's Inbox Summary\n\n{bullets}"
