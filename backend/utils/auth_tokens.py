import base64
import hashlib
import hmac
import json
import time
from typing import Any

from backend.config import settings


TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30


def create_session_token(user: dict[str, Any]) -> str:
    payload = {
        "email": user["email"],
        "name": user.get("name"),
        "google_id": user.get("google_id"),
        "iat": int(time.time()),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def verify_session_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid session token.") from exc

    expected = _sign(encoded_payload)
    if not hmac.compare_digest(signature, expected):
        raise ValueError("Invalid session token signature.")

    payload = json.loads(_b64decode(encoded_payload).decode("utf-8"))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Session token has expired.")
    if not payload.get("email"):
        raise ValueError("Session token is missing email.")
    return payload


def _sign(value: str) -> str:
    secret = (
        settings.SUPABASE_SERVICE_ROLE_KEY
        or settings.GOOGLE_CLIENT_SECRET
        or settings.APP_NAME
    ).encode("utf-8")
    digest = hmac.new(secret, value.encode("utf-8"), hashlib.sha256).digest()
    return _b64encode(digest)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
