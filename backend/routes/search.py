from fastapi import APIRouter

from backend.models.schemas import SearchRequest, SearchResponse
from backend.services.supabase_service import SupabaseService
from backend.services.vector_service import VectorService


router = APIRouter()
vector_service = VectorService()
supabase_service = SupabaseService()


@router.post("", response_model=SearchResponse)
@router.post("/", response_model=SearchResponse, include_in_schema=False)
async def semantic_search(payload: SearchRequest) -> SearchResponse:
    account_email = await supabase_service.get_active_account_email()
    emails = await supabase_service.list_emails(limit=100, account_email=account_email)
    vector_service.rebuild(emails)
    results = vector_service.search(payload.query, top_k=payload.top_k)
    return SearchResponse(query=payload.query, results=results)
