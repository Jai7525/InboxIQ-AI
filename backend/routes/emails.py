from fastapi import APIRouter, HTTPException, Query

from backend.models.schemas import EmailIngestResponse, EmailListResponse, InboxSummaryResponse
from backend.services.email_sync_service import EmailSyncService
from backend.services.summary_service import SummaryService
from backend.services.supabase_service import SupabaseService


router = APIRouter()
email_sync_service = EmailSyncService()
supabase_service = SupabaseService()
summary_service = SummaryService()


@router.get("", response_model=EmailListResponse)
@router.get("/", response_model=EmailListResponse, include_in_schema=False)
async def list_emails(limit: int = Query(default=20, ge=1, le=100)) -> EmailListResponse:
    account_email = await supabase_service.get_active_account_email()
    emails = await supabase_service.list_emails(limit=limit, account_email=account_email)
    return EmailListResponse(total=len(emails), emails=emails)


@router.get("/summary", response_model=InboxSummaryResponse)
async def inbox_summary() -> InboxSummaryResponse:
    return await summary_service.generate_daily_summary()


@router.post("/sync", response_model=EmailIngestResponse)
async def sync_emails(
    limit: int = Query(default=25, ge=1, le=100),
    mode: str = Query(default="initial", pattern="^(initial|background)$"),
) -> EmailIngestResponse:
    try:
        return await email_sync_service.sync(limit=limit, mode=mode)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/sync", response_model=EmailIngestResponse, include_in_schema=False)
async def sync_emails_from_browser(
    limit: int = Query(default=25, ge=1, le=100),
    mode: str = Query(default="initial", pattern="^(initial|background)$"),
) -> EmailIngestResponse:
    try:
        return await email_sync_service.sync(limit=limit, mode=mode)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/sync/status")
async def sync_status() -> dict:
    return email_sync_service.status()
