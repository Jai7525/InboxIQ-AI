import re
from pathlib import Path

from backend.config import BASE_DIR


URL_PATTERN = re.compile(r"https?://[^\s)>\]]+")


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def extract_urls(value: str) -> list[str]:
    return URL_PATTERN.findall(value or "")


def load_prompt(filename: str) -> str:
    path: Path = BASE_DIR / "prompts" / filename
    return path.read_text(encoding="utf-8")
