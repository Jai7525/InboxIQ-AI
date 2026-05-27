from fastapi import APIRouter

from backend.dependencies import CurrentUser
from backend.models.schemas import AnalyticsResponse
from backend.services.supabase_service import SupabaseService


router = APIRouter()
supabase_service = SupabaseService()


@router.get("/", response_model=AnalyticsResponse)
@router.get("/overview", response_model=AnalyticsResponse)
async def analytics(current_user: CurrentUser) -> AnalyticsResponse:
    account_email = current_user["email"]
    emails = await supabase_service.list_emails(limit=500, account_email=account_email)
    by_category: dict[str, int] = {}
    by_threat: dict[str, int] = {}

    for email in emails:
        by_category[email.category] = by_category.get(email.category, 0) + 1
        by_threat[email.threat_level] = by_threat.get(email.threat_level, 0) + 1

    urgent = sum(1 for email in emails if email.priority >= 8)
    threats = sum(1 for email in emails if email.threat_level in {"suspicious", "spam", "phishing", "malicious"})
    return AnalyticsResponse(
        total_emails=len(emails),
        urgent_emails=urgent,
        threat_alerts=threats,
        categories=by_category,
        threats=by_threat,
    )
