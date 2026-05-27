import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from backend.config import settings
from backend.database.queries import EMAIL_METADATA_TABLE, EMAILS_TABLE, USERS_TABLE
from backend.database.supabase_client import get_supabase_client
from backend.models.schemas import EmailItem
from backend.utils.logger import get_logger


logger = get_logger(__name__)


class SupabaseService:
    def __init__(self) -> None:
        self.local_path: Path = settings.DATA_DIR / "emails.json"
        self.metadata_path: Path = settings.DATA_DIR / "email_metadata.json"
        self.users_path: Path = settings.DATA_DIR / "users.json"
        self.local_path.parent.mkdir(parents=True, exist_ok=True)
        self.client = get_supabase_client()

    async def upsert_email(self, email: EmailItem) -> None:
        account_email = self._resolve_account_email(email)
        if email.account_email != account_email:
            email = email.model_copy(update={"account_email": account_email})

        emails = {(item.account_email or "", item.id): item for item in await self.list_emails(limit=10000)}
        emails[(account_email, email.id)] = email
        payload = [item.model_dump(mode="json") for item in emails.values()]
        self.local_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

        if self.client:
            try:
                self.client.table(EMAILS_TABLE).upsert(email.model_dump(mode="json"), on_conflict="account_email,id").execute()
            except Exception as exc:
                logger.warning("Could not upsert email %s into Supabase emails table: %s", email.id, exc)

        await self.upsert_email_metadata(email)

    async def clear_emails(self, account_email: str | None = None) -> None:
        if account_email and self.client:
            try:
                self.client.table(EMAILS_TABLE).delete().eq("account_email", account_email).execute()
            except Exception as exc:
                logger.warning("Could not clear Supabase emails for %s: %s", account_email, exc)

            try:
                self.client.table(EMAIL_METADATA_TABLE).delete().eq("account_email", account_email).execute()
            except Exception as exc:
                logger.warning("Could not clear Supabase email_metadata for %s: %s", account_email, exc)

        if account_email:
            self._filter_local_file(self.local_path, lambda item: item.get("account_email") != account_email)
            self._filter_local_file(self.metadata_path, lambda item: item.get("account_email") != account_email)
            return

        for path in (self.local_path, self.metadata_path):
            if path.exists():
                path.unlink()

    async def upsert_email_metadata(self, email: EmailItem) -> None:
        metadata = self._build_email_metadata(email)
        if self.client:
            self._upsert_supabase_email_metadata(metadata)
        self._upsert_local_metadata(metadata)

    def _upsert_supabase_email_metadata(self, metadata: dict) -> None:
        try:
            self.client.table(EMAIL_METADATA_TABLE).upsert(metadata, on_conflict="account_email,email_id").execute()
            return
        except Exception as exc:
            logger.warning(
                "Supabase email_metadata upsert failed for %s/%s: %s",
                metadata.get("account_email"),
                metadata.get("email_id"),
                exc,
            )

        try:
            response = (
                self.client.table(EMAIL_METADATA_TABLE)
                .update(metadata)
                .eq("account_email", metadata["account_email"])
                .eq("email_id", metadata["email_id"])
                .execute()
            )
            if response.data:
                return

            self.client.table(EMAIL_METADATA_TABLE).insert(metadata).execute()
        except Exception as exc:
            logger.error(
                "Supabase email_metadata fallback write failed for %s/%s: %s",
                metadata.get("account_email"),
                metadata.get("email_id"),
                exc,
            )

    async def list_emails(self, limit: int = 100, account_email: str | None = None) -> list[EmailItem]:
        if self.client:
            try:
                query = self.client.table(EMAILS_TABLE).select("*").order("received_at", desc=True).limit(limit)
                if account_email:
                    query = query.eq("account_email", account_email)
                response = query.execute()
                if response.data:
                    return [EmailItem(**item) for item in response.data]
            except Exception as exc:
                logger.warning("Could not list Supabase emails; falling back to local data: %s", exc)

        if not self.local_path.exists():
            if settings.MOCK_MODE:
                return self._mock_emails(limit, account_email=account_email)
            return []

        data = json.loads(self.local_path.read_text(encoding="utf-8"))
        if account_email:
            data = [item for item in data if item.get("account_email") == account_email]
        data.sort(key=lambda item: item.get("received_at", ""), reverse=True)
        return [EmailItem(**item) for item in data[:limit]]

    async def upsert_user(
        self,
        *,
        email: str,
        name: str | None = None,
        google_id: str | None = None,
        refresh_token: str | None = None,
        access_token: str | None = None,
        token_payload: dict | None = None,
    ) -> dict:
        payload = {
            "email": email,
            "name": name,
            "google_id": google_id,
            "refresh_token": refresh_token,
            "access_token": access_token,
            "token_payload": token_payload,
        }
        payload = {key: value for key, value in payload.items() if value is not None}

        if self.client:
            try:
                response = self.client.table(USERS_TABLE).upsert(payload, on_conflict="email").execute()
                if response.data:
                    return response.data[0]
            except Exception as exc:
                logger.warning("Could not upsert Supabase user %s; falling back to local data: %s", email, exc)

        return self._upsert_local_user(payload)

    async def clear_user_refresh_token(self, email: str | None = None) -> None:
        if email and self.client:
            try:
                self.client.table(USERS_TABLE).update(
                    {"refresh_token": None, "access_token": None, "token_payload": None}
                ).eq("email", email).execute()
            except Exception as exc:
                logger.warning("Could not clear Supabase refresh token for %s: %s", email, exc)

        if self.users_path.exists():
            users = json.loads(self.users_path.read_text(encoding="utf-8"))
            updated = []
            for user in users:
                if email is None or user.get("email") == email:
                    user = {**user, "refresh_token": None, "access_token": None, "token_payload": None}
                updated.append(user)
            self.users_path.write_text(json.dumps(updated, indent=2), encoding="utf-8")

    async def get_user_by_email(self, email: str) -> dict | None:
        if self.client:
            try:
                response = (
                    self.client.table(USERS_TABLE)
                    .select("id,email,name,google_id,refresh_token,access_token,token_payload,created_at")
                    .eq("email", email)
                    .limit(1)
                    .execute()
                )
                if response.data:
                    return response.data[0]
            except Exception as exc:
                logger.warning("Could not read Supabase user %s; falling back to local data: %s", email, exc)

        if not self.users_path.exists():
            return None

        users = json.loads(self.users_path.read_text(encoding="utf-8"))
        return next((user for user in users if user.get("email") == email), None)

    async def get_user_tokens(self, email: str) -> dict | None:
        user = await self.get_user_by_email(email)
        if not user:
            return None
        token_payload = user.get("token_payload") or {}
        return {
            **token_payload,
            "access_token": user.get("access_token") or token_payload.get("access_token"),
            "refresh_token": user.get("refresh_token") or token_payload.get("refresh_token"),
        }

    async def list_connected_users(self) -> list[dict]:
        if self.client:
            try:
                response = (
                    self.client.table(USERS_TABLE)
                    .select("id,email,name,google_id,refresh_token")
                    .not_.is_("refresh_token", "null")
                    .execute()
                )
                return response.data or []
            except Exception as exc:
                logger.warning("Could not list connected Supabase users; falling back to local data: %s", exc)

        if not self.users_path.exists():
            return []

        users = json.loads(self.users_path.read_text(encoding="utf-8"))
        return [user for user in users if user.get("refresh_token")]

    async def get_latest_user(self) -> dict | None:
        if self.client:
            try:
                response = self.client.table(USERS_TABLE).select("id,email,name,google_id,refresh_token,created_at").order("created_at", desc=True).limit(1).execute()
                if response.data:
                    return response.data[0]
            except Exception as exc:
                logger.warning("Could not read latest Supabase user; falling back to local data: %s", exc)

        if not self.users_path.exists():
            return None

        users = json.loads(self.users_path.read_text(encoding="utf-8"))
        if not users:
            return None

        return sorted(users, key=lambda user: user.get("created_at", ""), reverse=True)[0]

    def _mock_emails(self, limit: int, account_email: str | None = None) -> list[EmailItem]:
        from backend.services.email_processor import EmailProcessor
        from backend.services.gmail_service import GmailService

        gmail_service = GmailService()
        email_processor = EmailProcessor()
        return [email_processor.process({**raw_email, "account_email": account_email or raw_email.get("recipient")}) for raw_email in gmail_service._mock_emails(limit)]

    def _build_email_metadata(self, email: EmailItem) -> dict:
        account_email = self._resolve_account_email(email)
        return {
            "email_id": email.id,
            "account_email": account_email,
            "category": email.category,
            "priority": email.priority,
            "sender": email.sender,
            "summary": self._summarize_email(email),
        }

    def _resolve_account_email(self, email: EmailItem) -> str:
        account_email = (email.account_email or email.recipient or "").strip()
        if not account_email:
            raise RuntimeError("Cannot store email without account_email. Reconnect Gmail and sync again.")
        return account_email

    def _summarize_email(self, email: EmailItem) -> str:
        source = email.snippet or email.body or email.subject
        summary = source.strip()
        if len(summary) <= 220:
            return summary
        return f"{summary[:217].rstrip()}..."

    def _upsert_local_metadata(self, metadata: dict) -> None:
        records = []
        if self.metadata_path.exists():
            records = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        by_id = {(record.get("account_email") or "", record["email_id"]): record for record in records}
        by_id[(metadata.get("account_email") or "", metadata["email_id"])] = metadata
        payload = list(by_id.values())
        self.metadata_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _filter_local_file(self, path: Path, keep_record) -> None:
        if not path.exists():
            return
        records = json.loads(path.read_text(encoding="utf-8"))
        path.write_text(json.dumps([record for record in records if keep_record(record)], indent=2), encoding="utf-8")

    def _upsert_local_user(self, user: dict) -> dict:
        records = []
        if self.users_path.exists():
            records = json.loads(self.users_path.read_text(encoding="utf-8"))

        by_email = {record["email"]: record for record in records}
        existing = by_email.get(
            user["email"],
            {
                "id": str(uuid4()),
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        by_email[user["email"]] = {**existing, **user}

        payload = list(by_email.values())
        self.users_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return by_email[user["email"]]
