import base64
import json
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.request import Request as UrlRequest, urlopen
from urllib.parse import urlencode
from uuid import uuid4

from backend.config import settings
from backend.models.schemas import TokenResponse


class GmailService:
    scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid",
    ]

    def build_auth_url(self) -> str:
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID or "mock-google-client-id",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str) -> TokenResponse:
        if settings.MOCK_MODE or not settings.GOOGLE_CLIENT_SECRET:
            token_response = TokenResponse(
                access_token=f"mock-access-token-{code[:8]}",
                refresh_token="mock-refresh-token",
                expires_in=3600,
            )
            return token_response

        try:
            from google_auth_oauthlib.flow import Flow
        except ImportError as exc:
            raise RuntimeError("Install google-auth-oauthlib to complete Google OAuth.") from exc

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=self.scopes,
            redirect_uri=settings.GOOGLE_REDIRECT_URI,
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials
        token_payload = {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "expires_in": 3600,
            "token_type": "Bearer",
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
        }
        return TokenResponse(**token_payload)

    async def fetch_user_profile(self, access_token: str) -> dict:
        if settings.MOCK_MODE or access_token.startswith("mock-access-token"):
            return {
                "id": "mock-google-id",
                "email": "mock.user@example.com",
                "name": "Mock User",
            }

        request = UrlRequest(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    async def fetch_saved_account_profile(self, tokens: dict | None = None) -> dict | None:
        if not tokens:
            return None

        access_token = tokens.get("access_token")
        if access_token:
            try:
                return await self.fetch_user_profile(access_token)
            except Exception:
                pass

        try:
            service = self._build_gmail_client(tokens)
            profile = service.users().getProfile(userId="me").execute()
        except Exception:
            return None

        email = profile.get("emailAddress")
        if not email:
            return None

        return {
            "email": email,
            "name": email.split("@")[0],
            "id": profile.get("historyId"),
        }

    async def fetch_inbox(
        self,
        limit: int = 25,
        query: str = "newer_than:7d in:inbox",
        tokens: dict | None = None,
    ) -> list[dict]:
        if settings.MOCK_MODE:
            return self._mock_emails(limit)

        service = self._build_gmail_client(tokens)
        response = (
            service.users()
            .messages()
            .list(userId="me", q=query, labelIds=["INBOX"], maxResults=limit)
            .execute()
        )
        messages = response.get("messages", [])
        emails = []
        for message in messages:
            detail = (
                service.users()
                .messages()
                .get(userId="me", id=message["id"], format="full")
                .execute()
            )
            emails.append(self._parse_message(detail))
        return emails

    def _build_gmail_client(self, tokens: dict | None):
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
        except ImportError as exc:
            raise RuntimeError("Install google-api-python-client and google-auth to fetch Gmail.") from exc

        if not tokens:
            raise RuntimeError("No Google tokens found. Visit /auth/google/login first.")

        credentials = Credentials(
            token=tokens.get("access_token"),
            refresh_token=tokens.get("refresh_token"),
            token_uri=tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=tokens.get("client_id", settings.GOOGLE_CLIENT_ID),
            client_secret=tokens.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            scopes=tokens.get("scopes", self.scopes),
        )
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            tokens["access_token"] = credentials.token
        return build("gmail", "v1", credentials=credentials, cache_discovery=False)

    def _parse_message(self, message: dict) -> dict:
        payload = message.get("payload", {})
        headers = {item["name"].lower(): item["value"] for item in payload.get("headers", [])}
        received_at = datetime.now(timezone.utc)
        if headers.get("date"):
            try:
                received_at = parsedate_to_datetime(headers["date"])
            except (TypeError, ValueError):
                received_at = datetime.now(timezone.utc)

        body = self._extract_body(payload)
        return {
            "id": message.get("id"),
            "thread_id": message.get("threadId"),
            "sender": headers.get("from", "unknown@example.com"),
            "recipient": headers.get("to"),
            "subject": headers.get("subject", "No subject"),
            "snippet": message.get("snippet", body[:140]),
            "body": body or message.get("snippet", ""),
            "received_at": received_at,
        }

    def _extract_body(self, payload: dict) -> str:
        body_data = payload.get("body", {}).get("data")
        if body_data:
            return self._decode_body(body_data)
        for part in payload.get("parts", []) or []:
            mime_type = part.get("mimeType", "")
            if mime_type == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    return self._decode_body(data)
            nested = self._extract_body(part)
            if nested:
                return nested
        return ""

    def _decode_body(self, value: str) -> str:
        padded = value + "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8", errors="ignore")

    def _mock_emails(self, limit: int) -> list[dict]:
        now = datetime.now(timezone.utc)
        samples = [
            {
                "sender": "hr@techcorp.example",
                "subject": "Interview Invitation for AI Engineer Role",
                "body": "You have been shortlisted for an AI Engineer interview tomorrow at 10 AM. Please confirm your availability.",
            },
            {
                "sender": "security-payments@example-alerts.com",
                "subject": "Urgent: Verify your bank account now",
                "body": "Your account will be suspended. Click http://verify-bank-login.example.ru immediately to restore access.",
            },
            {
                "sender": "professor@college.edu",
                "subject": "Final year project review meeting",
                "body": "Please share your InboxIQ AI progress report and attend the review meeting this Friday.",
            },
            {
                "sender": "offers@shop.example",
                "subject": "Weekend sale is live",
                "body": "Flat discounts on electronics, subscriptions, and accessories for a limited time.",
            },
        ]
        emails = []
        for index in range(limit):
            sample = samples[index % len(samples)]
            emails.append(
                {
                    "id": str(uuid4()),
                    "thread_id": f"thread-{index % 3}",
                    "recipient": "user@example.com",
                    "snippet": sample["body"][:140],
                    "received_at": now - timedelta(hours=index),
                    **sample,
                }
            )
        return emails
