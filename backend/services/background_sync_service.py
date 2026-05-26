import asyncio
from contextlib import suppress
from datetime import datetime, timezone

from backend.config import settings
from backend.services.email_sync_service import EmailSyncService
from backend.utils.logger import get_logger


logger = get_logger(__name__)


class BackgroundSyncService:
    def __init__(self) -> None:
        self.sync_service = EmailSyncService()
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()

    def start(self) -> None:
        if not settings.BACKGROUND_SYNC_ENABLED:
            logger.info("Background email sync is disabled.")
            return
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._run())
        logger.info("Background email sync started.")

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task:
            self._task.cancel()
            with suppress(asyncio.CancelledError):
                await self._task

    async def _run(self) -> None:
        while not self._stop_event.is_set():
            delay = self._seconds_until_next_sync()
            if delay > 0:
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=delay)
                    break
                except asyncio.TimeoutError:
                    pass

            try:
                await self.sync_service.sync(
                    limit=settings.BACKGROUND_SYNC_LIMIT,
                    mode="background",
                )
            except Exception as exc:
                logger.warning("Background email sync skipped: %s", exc)

            try:
                await asyncio.wait_for(
                    self._stop_event.wait(),
                    timeout=settings.BACKGROUND_SYNC_INTERVAL_SECONDS,
                )
            except asyncio.TimeoutError:
                continue

    def _seconds_until_next_sync(self) -> float:
        last_sync_at = self.sync_service.sync_state.get_last_sync_at()
        if not last_sync_at:
            return 0
        elapsed = datetime.now(timezone.utc).timestamp() - last_sync_at.timestamp()
        return max(settings.BACKGROUND_SYNC_INTERVAL_SECONDS - elapsed, 0)
