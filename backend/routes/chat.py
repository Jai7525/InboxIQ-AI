from fastapi import APIRouter

from backend.models.schemas import ChatRequest, ChatResponse, InboxSummaryResponse
from backend.services.rag_service import RAGService
from backend.services.summary_service import SummaryService


router = APIRouter()
rag_service = RAGService()
summary_service = SummaryService()


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse, include_in_schema=False)
async def chat(payload: ChatRequest) -> ChatResponse:
    return await rag_service.answer(payload)


@router.get("/summary", response_model=InboxSummaryResponse)
async def inbox_summary() -> InboxSummaryResponse:
    return await summary_service.generate_daily_summary()
