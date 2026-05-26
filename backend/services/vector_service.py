import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.config import settings
from backend.models.schemas import EmailItem, SearchResult
from backend.services.embedding_service import EmbeddingService


class VectorService:
    def __init__(self) -> None:
        self.embedding_service = EmbeddingService()
        self.store_path: Path = settings.VECTOR_STORE_DIR / "emails.json"
        self.faiss_path: Path = settings.VECTOR_STORE_DIR / "emails.faiss"
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self._items: dict[str, dict] = self._load()

    def upsert_email(self, email: EmailItem) -> None:
        text = self._email_text(email)
        self._items[email.id] = {
            "email": email.model_dump(mode="json"),
            "embedding": self.embedding_service.embed(text),
        }

    def rebuild(self, emails: list[EmailItem]) -> None:
        self._items = {}
        self._delete_existing_index()
        for email in emails:
            self.upsert_email(email)
        self.save()

    def search(self, query: str, top_k: int = 5) -> list[SearchResult]:
        self._items = self._load()
        if not self._items:
            return []

        query_embedding = self.embedding_service.embed(query)
        scored: list[tuple[float, EmailItem]] = []
        for item in self._items.values():
            semantic_score = self._cosine(query_embedding, item["embedding"])
            email = EmailItem(**item["email"])
            scored.append((self._hybrid_score(query, email, semantic_score), email))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [SearchResult(email=email, score=round(score, 4)) for score, email in scored[:top_k]]

    def save(self) -> None:
        self.store_path.write_text(json.dumps(self._items, indent=2), encoding="utf-8")
        self._save_faiss()

    def clear(self) -> None:
        self._items = {}
        self._delete_existing_index()

    def _load(self) -> dict[str, dict]:
        if not self.store_path.exists():
            return {}
        return json.loads(self.store_path.read_text(encoding="utf-8"))

    def _email_text(self, email: EmailItem) -> str:
        return f"{email.subject}\n{email.sender}\n{email.category}\n{email.body}"

    def _cosine(self, left: list[float], right: list[float]) -> float:
        numerator = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
        right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
        return numerator / (left_norm * right_norm)

    def _rerank_results(self, query: str, results: list[SearchResult], top_k: int) -> list[SearchResult]:
        reranked = [
            SearchResult(
                email=result.email,
                score=round(self._hybrid_score(query, result.email, result.score), 4),
            )
            for result in results
        ]
        reranked.sort(key=lambda result: result.score, reverse=True)
        return reranked[:top_k]

    def _hybrid_score(self, query: str, email: EmailItem, vector_score: float) -> float:
        semantic_similarity = self._normalize_similarity(vector_score)
        keyword_match = self._keyword_match_score(query, email)
        classification_score = self._classification_score(query, email)
        sender_priority = self._sender_priority_score(query, email)
        recency_score = self._recency_score(email)

        final_score = (
            semantic_similarity * 0.45
            + keyword_match * 0.25
            + classification_score * 0.15
            + sender_priority * 0.10
            + recency_score * 0.05
        )
        return max(0.0, min(final_score, 1.0))

    def _normalize_similarity(self, score: float) -> float:
        if score < 0:
            return max(0.0, min((score + 1.0) / 2.0, 1.0))
        return max(0.0, min(score, 1.0))

    def _tokens(self, value: str) -> list[str]:
        stop_words = {
            "the",
            "and",
            "for",
            "with",
            "from",
            "about",
            "email",
            "emails",
            "show",
            "find",
            "search",
            "give",
            "me",
            "my",
            "all",
            "related",
        }
        return [token for token in re.findall(r"[a-z0-9]+", value.lower()) if len(token) > 2 and token not in stop_words]

    def _keyword_match_score(self, query: str, email: EmailItem) -> float:
        terms = self._tokens(query)
        if not terms:
            return 0.0

        subject = email.subject.lower()
        sender = email.sender.lower()
        body = f"{email.snippet} {email.body}".lower()
        category = email.category.lower()
        score = 0.0

        for term in terms:
            if term in subject:
                score += 1.0
            elif term in sender or term in category:
                score += 0.85
            elif term in body:
                score += 0.65

        phrase_bonus = 0.15 if query.lower().strip() and query.lower().strip() in f"{subject} {body}" else 0.0
        return min((score / len(terms)) + phrase_bonus, 1.0)

    def _classification_score(self, query: str, email: EmailItem) -> float:
        query_text = query.lower()
        email_text = f"{email.subject} {email.sender} {email.category} {email.snippet} {email.body}".lower()
        category = email.category.lower()
        score = 0.0

        category_intents = {
            "recruitment": ["placement", "hiring", "internship", "interview", "career", "job", "recruitment", "shortlisted"],
            "finance": ["payment", "invoice", "bill", "due", "refund", "subscription"],
            "security": ["security", "sign-in", "login", "account", "password", "verification"],
            "education": ["course", "class", "exam", "assignment", "webinar", "workshop", "learning"],
            "promotions": ["offer", "discount", "sale", "coupon", "deal", "promotion"],
        }

        for expected_category, terms in category_intents.items():
            if any(term in query_text for term in terms):
                if category == expected_category:
                    score = max(score, 1.0)
                elif any(term in email_text for term in terms):
                    score = max(score, 0.75)

        if any(term in query_text for term in ["urgent", "important", "priority"]):
            score = max(score, min(email.priority / 10, 1.0))
        if any(term in query_text for term in ["threat", "phishing", "suspicious", "scam"]):
            score = max(score, email.threat_score if email.threat_level != "safe" else 0.0)
        if any(term in query_text for term in ["reply", "respond", "response"]):
            reply_signal = any("respond" in action.lower() or "reply" in action.lower() for action in email.suggested_actions)
            content_signal = any(term in email_text for term in ["reply", "respond", "confirm", "rsvp", "action required"])
            score = max(score, 1.0 if reply_signal or content_signal else 0.0)

        return max(0.0, min(score, 1.0))

    def _sender_priority_score(self, query: str, email: EmailItem) -> float:
        query_terms = set(self._tokens(query))
        sender = email.sender.lower()
        sender_domain = sender.split("@")[-1].replace(">", "").strip() if "@" in sender else sender
        trusted_or_useful_domains = [
            "linkedin",
            "unstop",
            "naukri",
            "indeed",
            "google",
            "microsoft",
            "amazon",
            "tcs",
            "infosys",
            "wipro",
            "college",
            "edu",
        ]
        hr_terms = ["hr", "career", "careers", "recruit", "talent", "jobs", "placement"]

        if any(term in sender for term in query_terms):
            return 1.0
        if any(term in sender for term in hr_terms) and any(term in query.lower() for term in ["job", "hiring", "placement", "internship", "career"]):
            return 0.95
        if any(domain in sender_domain for domain in trusted_or_useful_domains):
            return 0.7
        if email.priority >= 8:
            return 0.55
        if email.priority >= 6:
            return 0.35
        return 0.15

    def _recency_score(self, email: EmailItem) -> float:
        received_at = email.received_at
        if received_at.tzinfo is None:
            received_at = received_at.replace(tzinfo=timezone.utc)

        age_days = max((datetime.now(timezone.utc) - received_at.astimezone(timezone.utc)).total_seconds() / 86400, 0)
        if age_days <= 1:
            return 1.0
        if age_days <= 3:
            return 0.8
        if age_days <= 7:
            return 0.6
        if age_days <= 30:
            return 0.3
        return 0.1

    def _load_vector_libs(self) -> tuple[Any, Any] | None:
        try:
            import faiss
            import numpy as np

            return faiss, np
        except Exception:
            return None

    def _delete_existing_index(self) -> None:
        for path in (self.store_path, self.faiss_path):
            if path.exists():
                path.unlink()

    def _save_faiss(self) -> None:
        libs = self._load_vector_libs()
        if not libs or not self._items:
            return

        faiss, np = libs
        embeddings = [item["embedding"] for item in self._items.values()]
        matrix = np.array(embeddings, dtype="float32")
        if matrix.ndim != 2 or matrix.shape[0] == 0:
            return

        index = faiss.IndexFlatIP(matrix.shape[1])
        index.add(matrix)
        faiss.write_index(index, str(self.faiss_path))

    def _search_faiss(self, query_embedding: list[float], top_k: int) -> list[SearchResult] | None:
        libs = self._load_vector_libs()
        if not libs or not self.faiss_path.exists():
            return None

        faiss, np = libs
        index = faiss.read_index(str(self.faiss_path))
        query = np.array([query_embedding], dtype="float32")
        candidate_count = min(max(top_k * 10, 25), len(self._items))
        scores, indices = index.search(query, candidate_count)
        ordered_items = list(self._items.values())

        results: list[SearchResult] = []
        for score, item_index in zip(scores[0], indices[0]):
            if item_index < 0 or item_index >= len(ordered_items):
                continue
            email = EmailItem(**ordered_items[item_index]["email"])
            results.append(SearchResult(email=email, score=round(float(score), 4)))
        return results
