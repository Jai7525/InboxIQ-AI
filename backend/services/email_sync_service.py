import asyncio
from datetime import datetime, timezone

from backend.models.schemas import EmailIngestResponse, EmailItem
from backend.services.email_processor import EmailProcessor
from backend.services.gmail_service import GmailService
from backend.services.supabase_service import SupabaseService
from backend.services.sync_state_service import SyncStateService
from backend.services.vector_service import VectorService


class EmailSyncService:
    def __init__(self) -> None:
        self.gmail_service = GmailService()
        self.email_processor = EmailProcessor()
        self.vector_service = VectorService()
        self.supabase_service = SupabaseService()
        self.sync_state = SyncStateService()
        self._lock = asyncio.Lock()

    async def sync(self, account_email: str, limit: int = 25, mode: str = "initial") -> EmailIngestResponse:
        async with self._lock:
            tokens = await self.supabase_service.get_user_tokens(account_email)
            if not tokens or not tokens.get("refresh_token"):
                raise RuntimeError("No connected Google account found. Visit /auth/google/login first.")

            gmail_query = self._build_query(mode)
            raw_emails = await self.gmail_service.fetch_inbox(limit=limit, query=gmail_query, tokens=tokens)
            processed: list[EmailItem] = []

            if mode == "initial":
                await self.supabase_service.clear_emails(account_email=account_email)
                self.vector_service.clear()
                self.sync_state.clear()

            for raw_email in raw_emails:
                raw_email["account_email"] = account_email
                email = self.email_processor.process(raw_email)
                processed.append(email)
                self.vector_service.upsert_email(email)

            self.vector_service.save()

            for email in processed:
                if not email.account_email:
                    raise RuntimeError("Gmail sync returned an email without account_email. Reconnect Gmail and sync again.")
                await self.supabase_service.upsert_email(email)

            self.sync_state.set_last_sync_at(datetime.now(timezone.utc))
            return EmailIngestResponse(
                processed=len(processed),
                emails=processed,
                sync_mode=mode,
                gmail_query=gmail_query,
                pipeline_steps=[
                    "replace_existing_initial_cache" if mode == "initial" else "preserve_existing_background_cache",
                    "fetch_email_text",
                    "clean_content",
                    "classify_category_and_priority",
                    "detect_threat",
                    "generate_embedding",
                    "store_in_faiss",
                    "store_metadata_in_supabase",
                ],
            )

    def status(self) -> dict:
        return self.sync_state.status()

    def _build_query(self, mode: str) -> str:
        if mode == "background":
            return self.sync_state.build_background_query()
        return "newer_than:7d in:inbox"
