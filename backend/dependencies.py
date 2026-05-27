from typing import Annotated

from fastapi import Depends, Header, HTTPException

from backend.services.supabase_service import SupabaseService
from backend.utils.auth_tokens import verify_session_token


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = verify_session_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    user = await SupabaseService().get_user_by_email(payload["email"])
    if not user or not user.get("refresh_token"):
        raise HTTPException(status_code=401, detail="Gmail account is not connected.")

    return {
        "email": user["email"],
        "name": user.get("name") or payload.get("name"),
        "google_id": user.get("google_id") or payload.get("google_id"),
    }


CurrentUser = Annotated[dict, Depends(get_current_user)]
