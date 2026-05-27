from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import RedirectResponse

from backend.config import settings
from backend.models.schemas import AuthCallbackRequest, AuthUrlResponse, TokenResponse
from backend.services.email_sync_service import EmailSyncService
from backend.services.gmail_service import GmailService
from backend.services.supabase_service import SupabaseService
from backend.services.sync_state_service import SyncStateService
from backend.services.vector_service import VectorService
from backend.utils.logger import get_logger


router = APIRouter()
gmail_service = GmailService()
supabase_service = SupabaseService()
sync_state_service = SyncStateService()
vector_service = VectorService()
logger = get_logger(__name__)


@router.get("/google/login")
async def google_login():
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and not settings.MOCK_MODE:
        return RedirectResponse(gmail_service.build_auth_url())
    return AuthUrlResponse(auth_url=gmail_service.build_auth_url())


@router.get("/google/url", response_model=AuthUrlResponse)
async def get_google_auth_url() -> AuthUrlResponse:
    return AuthUrlResponse(auth_url=gmail_service.build_auth_url())


@router.get("/google/callback")
async def google_callback_get(code: str = Query(...)):
    return await _handle_google_callback(code)


@router.get("/google/callback2")
async def google_callback2_get(code: str = Query(...)):
    return await _handle_google_callback(code)


async def _handle_google_callback(code: str) -> RedirectResponse:
    if not code:
        raise HTTPException(status_code=400, detail="Missing OAuth authorization code.")

    try:
        await _exchange_and_store_user(code)
    except Exception as exc:
        logger.exception("Google OAuth callback failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Google OAuth callback failed: {exc}") from exc

    return RedirectResponse(f"{settings.FRONTEND_URL}/?gmail=connected")


@router.post("/google/callback", response_model=TokenResponse)
async def google_callback_post(payload: AuthCallbackRequest) -> TokenResponse:
    if not payload.code:
        raise HTTPException(status_code=400, detail="Missing OAuth authorization code.")
    return await _exchange_and_store_user(payload.code)


@router.post("/logout")
async def logout(payload: dict = Body(default_factory=dict)) -> dict[str, str]:
    email = payload.get("email") if isinstance(payload, dict) else None
    if not email:
        tokens = gmail_service.load_tokens()
        access_token = tokens.get("access_token") if tokens else None
        if access_token:
            try:
                profile = await gmail_service.fetch_user_profile(access_token)
                email = profile.get("email")
            except Exception:
                email = None

    gmail_service.clear_tokens()
    await supabase_service.clear_user_refresh_token(email)
    await supabase_service.clear_emails(account_email=email)
    vector_service.clear()
    sync_state_service.clear()
    return {"status": "logged_out"}


@router.get("/me")
async def current_user() -> dict:
    profile = await gmail_service.fetch_saved_account_profile()
    if profile:
        email = profile.get("email")
        if email:
            return {
                "connected": True,
                "email": email,
                "name": profile.get("name") or email.split("@")[0],
                "google_id": profile.get("id"),
            }

    user = await supabase_service.get_latest_user()
    if user:
        return {
            "connected": bool(user.get("refresh_token")),
            "email": user.get("email"),
            "name": user.get("name") or (user.get("email") or "").split("@")[0],
            "google_id": user.get("google_id"),
        }

    emails = await supabase_service.list_emails(limit=100)
    recipients = [email.recipient for email in emails if email.recipient]
    indexed_email = recipients[0] if recipients else None

    return {
        "connected": False,
        "email": indexed_email,
        "name": indexed_email.split("@")[0] if indexed_email else "No account connected",
        "google_id": None,
        "reconnect_required": bool(indexed_email),
    }


@router.get("/status")
async def auth_status() -> dict[str, bool | str]:
    configured = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)
    return {"google_oauth_configured": configured, "mock_mode": settings.MOCK_MODE}


async def _exchange_and_store_user(code: str) -> TokenResponse:
    previous_profile = await gmail_service.fetch_saved_account_profile()
    previous_user = await supabase_service.get_latest_user()
    previous_email = (previous_profile.get("email") if previous_profile else None) or (previous_user or {}).get("email")

    token_response = await gmail_service.exchange_code_for_tokens(code)
    profile = await gmail_service.fetch_user_profile(token_response.access_token)
    email = profile.get("email")

    if email:
        if previous_email and previous_email != email:
            vector_service.clear()
            sync_state_service.clear()

        await supabase_service.upsert_user(
            email=email,
            name=profile.get("name"),
            google_id=profile.get("id"),
            refresh_token=token_response.refresh_token,
        )

        if settings.OAUTH_INITIAL_SYNC_ENABLED:
            try:
                await EmailSyncService().sync(limit=settings.OAUTH_INITIAL_SYNC_LIMIT, mode="initial")
            except Exception as exc:
                logger.warning("Initial Gmail sync after OAuth failed: %s", exc)

    return token_response
