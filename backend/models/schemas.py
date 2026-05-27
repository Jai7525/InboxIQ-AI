from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AuthUrlResponse(BaseModel):
    auth_url: str


class AuthCallbackRequest(BaseModel):
    code: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_in: int | None = None
    token_type: str = "Bearer"
    session_token: str | None = None
    email: str | None = None


class EmailItem(BaseModel):
    id: str
    account_email: str | None = None
    thread_id: str | None = None
    sender: str
    recipient: str | None = None
    subject: str
    snippet: str
    body: str
    received_at: datetime
    category: str = "personal"
    priority: int = Field(default=5, ge=1, le=10)
    threat_level: str = "safe"
    threat_score: float = Field(default=0.0, ge=0.0, le=1.0)
    suggested_actions: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class EmailListResponse(BaseModel):
    total: int
    emails: list[EmailItem]


class EmailIngestResponse(BaseModel):
    processed: int
    emails: list[EmailItem]
    sync_mode: str = "initial"
    gmail_query: str = "newer_than:7d in:inbox"
    pipeline_steps: list[str] = Field(default_factory=list)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    email: EmailItem
    score: float


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)


class ChatResponse(BaseModel):
    answer: str
    sources: list[SearchResult]
    retrieved_chunks: list[str] = Field(default_factory=list)
    rag_steps: list[str] = Field(default_factory=list)


class InboxSummaryResponse(BaseModel):
    summary: str
    highlights: list[str]
    urgent_count: int
    threat_count: int
    total_today: int = 0
    important_count: int = 0
    category_counts: dict[str, int] = Field(default_factory=dict)


class ThreatAnalysisRequest(BaseModel):
    subject: str
    body: str
    sender: str


class ThreatAnalysisResponse(BaseModel):
    threat_level: str
    threat_score: float = Field(ge=0.0, le=1.0)
    reasons: list[str]
    suspicious_urls: list[str] = Field(default_factory=list)


class ThreatListResponse(BaseModel):
    total: int
    threats: list[EmailItem]


class AnalyticsResponse(BaseModel):
    total_emails: int
    urgent_emails: int
    threat_alerts: int
    categories: dict[str, int]
    threats: dict[str, int]
