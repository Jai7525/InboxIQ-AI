import httpx
import re

from backend.config import settings
from backend.models.schemas import ChatRequest, ChatResponse
from backend.services.supabase_service import SupabaseService
from backend.services.vector_service import VectorService
from backend.utils.helpers import load_prompt


class RAGService:
    def __init__(self) -> None:
        self.vector_service = VectorService()
        self.supabase_service = SupabaseService()
        self.max_context_chars_per_email = 900

    async def answer(self, request: ChatRequest) -> ChatResponse:
        account_email = await self.supabase_service.get_active_account_email()
        emails = await self.supabase_service.list_emails(limit=100, account_email=account_email)
        self.vector_service.rebuild(emails)

        sources = self.vector_service.search(request.question, top_k=max(request.top_k, 10))
        sources = self._filter_sources_for_question(request.question, sources)[: request.top_k]
        retrieved_chunks = [self._source_context(result) for result in sources]
        context = "\n\n".join(retrieved_chunks)

        if not settings.GROQ_API_KEY or settings.MOCK_MODE:
            answer = self._mock_answer(request.question, sources)
            return self._response(answer, sources, retrieved_chunks)

        prompt = load_prompt("rag_chat_prompt.txt").format(context=context, question=request.question)
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                },
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError:
                return self._response(self._mock_answer(request.question, sources), sources, retrieved_chunks)
            data = response.json()
        return self._response(data["choices"][0]["message"]["content"], sources, retrieved_chunks)

    def _source_context(self, result) -> str:
        email = result.email
        body = (email.body or email.snippet or "")[: self.max_context_chars_per_email]
        return (
            f"Subject: {email.subject}\n"
            f"Sender: {email.sender}\n"
            f"Category: {email.category}\n"
            f"Summary: {email.snippet}\n"
            f"Body: {body}"
        )

    def _filter_sources_for_question(self, question: str, sources: list) -> list:
        lowered_question = question.lower()

        def email_text(result) -> str:
            email = result.email
            return f"{email.subject} {email.sender} {email.category} {email.snippet} {email.body}".lower()

        sender_match = re.search(r"\bfrom\s+([a-z0-9._%+-]+(?:@[a-z0-9.-]+)?|[a-z][a-z0-9 ._-]{1,40})", lowered_question)
        if sender_match:
            sender_query = sender_match.group(1).strip()
            sender_filtered = [result for result in sources if sender_query in result.email.sender.lower()]
            if sender_filtered:
                return sender_filtered

        if any(term in lowered_question for term in ["threat", "phishing", "suspicious", "malicious", "unsafe", "security"]):
            filtered = [result for result in sources if result.email.threat_level != "safe" or any(term in email_text(result) for term in ["security", "sign-in", "password", "account"])]
            return filtered or sources

        if any(term in lowered_question for term in ["urgent", "important", "priority"]):
            filtered = [result for result in sources if result.email.priority >= 7]
            return filtered or sources

        if any(term in lowered_question for term in ["payment", "invoice", "bill", "billing", "due", "amazon"]):
            payment_terms = ["payment", "invoice", "bill", "billing", "due", "receipt", "paid", "amazon"]
            filtered = [result for result in sources if any(term in email_text(result) for term in payment_terms)]
            return filtered or sources

        if any(term in lowered_question for term in ["placement", "career", "hiring", "internship", "job", "drive", "recruitment", "interview"]):
            placement_terms = ["placement", "career", "hiring", "internship", "job", "drive", "recruitment", "interview", "shortlisted"]
            filtered = []

            for result in sources:
                email = result.email
                text = email_text(result)
                if email.category == "recruitment" or any(term in text for term in placement_terms):
                    filtered.append(result)

            return filtered or sources

        if any(term in lowered_question for term in ["reply", "respond", "response", "follow up", "action"]):
            action_terms = ["reply", "respond", "confirm", "action required", "follow up", "schedule", "deadline"]
            filtered = [
                result
                for result in sources
                if result.email.priority >= 7
                or any(term in email_text(result) for term in action_terms)
                or any(term in action.lower() for action in result.email.suggested_actions for term in ["respond", "reply", "verify"])
            ]
            return filtered or sources

        if any(term in lowered_question for term in ["summary", "summarize", "today", "recent"]):
            return sources

        return sources

    def _mock_answer(self, question: str, sources: list) -> str:
        if not sources:
            return "I could not find matching emails yet. Sync the inbox first, then ask again."
        top = sources[0].email
        if any(term in question.lower() for term in ["placement", "career", "hiring", "internship", "job", "drive", "recruitment", "interview"]):
            bullets = [
                f"- {result.email.subject} from {result.email.sender}: {result.email.snippet}"
                for result in sources[:5]
            ]
            return "Here are the placement-related emails I found:\n" + "\n".join(bullets)
        if any(term in question.lower() for term in ["threat", "phishing", "suspicious", "malicious", "unsafe", "security"]):
            bullets = [
                f"- {result.email.subject} from {result.email.sender}: {result.email.snippet}"
                for result in sources[:5]
            ]
            return "Here are the security-related emails I found:\n" + "\n".join(bullets)
        if any(term in question.lower() for term in ["payment", "invoice", "bill", "billing", "due"]):
            bullets = [
                f"- {result.email.subject} from {result.email.sender}: {result.email.snippet}"
                for result in sources[:5]
            ]
            return "Here are the payment-related emails I found:\n" + "\n".join(bullets)
        if any(term in question.lower() for term in ["urgent", "important", "priority"]):
            bullets = [
                f"- {result.email.subject} from {result.email.sender}: {result.email.snippet}"
                for result in sources[:5]
            ]
            return "Here are the important emails I found:\n" + "\n".join(bullets)
        return (
            f"Based on the most relevant email, '{top.subject}' from {top.sender}, "
            f"the likely answer to '{question}' is related to: {top.snippet}"
        )

    def _response(self, answer: str, sources: list, retrieved_chunks: list[str]) -> ChatResponse:
        return ChatResponse(
            answer=answer,
            sources=sources,
            retrieved_chunks=retrieved_chunks,
            rag_steps=[
                "semantic_retrieval",
                "relevant_email_chunks",
                "groq_llm",
                "ai_generated_contextual_response",
            ],
        )
