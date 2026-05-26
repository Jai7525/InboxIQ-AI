import json
from datetime import datetime, timezone
from pathlib import Path

from backend.config import settings


class SyncStateService:
    def __init__(self) -> None:
        self.path: Path = settings.DATA_DIR / "sync_state.json"
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def get_last_sync_at(self) -> datetime | None:
        state = self._read_state()
        value = state.get("last_sync_at")
        if not value:
            return None
        return datetime.fromisoformat(value)

    def set_last_sync_at(self, value: datetime | None = None) -> None:
        current = value or datetime.now(timezone.utc)
        state = self._read_state()
        state["last_sync_at"] = current.isoformat()
        self.path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def clear(self) -> None:
        if self.path.exists():
            self.path.unlink()

    def status(self) -> dict:
        state = self._read_state()
        return {
            "last_sync_at": state.get("last_sync_at"),
            "background_query": self.build_background_query(),
        }

    def build_background_query(self) -> str:
        last_sync_at = self.get_last_sync_at()
        if not last_sync_at:
            return "newer_than:1h in:inbox"
        return f"after:{int(last_sync_at.timestamp())} in:inbox"

    def _read_state(self) -> dict:
        if not self.path.exists():
            return {}
        return json.loads(self.path.read_text(encoding="utf-8"))
