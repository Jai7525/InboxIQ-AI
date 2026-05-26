from fastapi import APIRouter

from backend.models.schemas import ThreatAnalysisRequest, ThreatAnalysisResponse, ThreatListResponse
from backend.services.supabase_service import SupabaseService
from backend.services.threat_detection import ThreatDetectionService


router = APIRouter()
threat_service = ThreatDetectionService()
supabase_service = SupabaseService()


@router.get("", response_model=ThreatListResponse)
@router.get("/", response_model=ThreatListResponse, include_in_schema=False)
async def list_threats() -> ThreatListResponse:
    account_email = await supabase_service.get_active_account_email()
    emails = await supabase_service.list_emails(limit=100, account_email=account_email)
    threats = [
        email
        for email in emails
        if email.threat_level in {"suspicious", "spam", "phishing", "malicious"}
    ]
    return ThreatListResponse(total=len(threats), threats=threats)


@router.post("/analyze", response_model=ThreatAnalysisResponse)
async def analyze_threat(payload: ThreatAnalysisRequest) -> ThreatAnalysisResponse:
    return threat_service.analyze_text(payload.subject, payload.body, payload.sender)
