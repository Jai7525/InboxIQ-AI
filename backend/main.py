from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.routes import analytics, auth, chat, emails, search, threats
from backend.services.background_sync_service import BackgroundSyncService


background_sync = BackgroundSyncService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    background_sync.start()
    try:
        yield
    finally:
        await background_sync.stop()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="RAG-based semantic inbox intelligence and threat detection API.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(emails.router, prefix="/emails", tags=["emails"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(threats.router, prefix="/threats", tags=["threats"])


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/sw.js", include_in_schema=False)
async def service_worker() -> Response:
    return Response(
        content="self.addEventListener('install', () => self.skipWaiting());\n",
        media_type="application/javascript",
        headers={"Cache-Control": "no-store"},
    )


@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> Response:
    return Response(status_code=204)
