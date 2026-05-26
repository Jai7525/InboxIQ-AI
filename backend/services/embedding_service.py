import hashlib
import math

from backend.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self._model = None

    def embed(self, text: str) -> list[float]:
        if settings.USE_LOCAL_EMBEDDINGS and self._model is None:
            self._load_model()
        if self._model:
            return self._model.encode(text, normalize_embeddings=True).tolist()
        return self._hash_embedding(text)

    def _load_model(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        except Exception:
            self._model = None

    def _hash_embedding(self, text: str, dimensions: int = 384) -> list[float]:
        vector = [0.0] * dimensions
        tokens = text.lower().split()
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:2], "big") % dimensions
            vector[index] += 1.0
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]
