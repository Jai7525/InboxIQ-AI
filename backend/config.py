from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    APP_NAME: str = "InboxIQ AI"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    LOCAL_TIMEZONE: str = "Asia/Kolkata"
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    FRONTEND_URL: str = "http://localhost:5173"

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None

    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    USE_LOCAL_EMBEDDINGS: bool = False
    BACKGROUND_SYNC_ENABLED: bool = True
    BACKGROUND_SYNC_INTERVAL_SECONDS: int = 3600
    BACKGROUND_SYNC_LIMIT: int = 25
    VECTOR_STORE_DIR: Path = BASE_DIR / "vector_store"
    DATA_DIR: Path = BASE_DIR / "data"
    MOCK_MODE: bool = True

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
