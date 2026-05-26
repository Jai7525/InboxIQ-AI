# InboxIQ AI Backend

FastAPI backend for the InboxIQ AI RAG-based semantic inbox intelligence and threat detection system.

## Features

- Google OAuth URL and callback route scaffolding
- Gmail inbox sync service with mock development data
- Email cleaning, classification, prioritization, and threat analysis
- Semantic search with a FAISS-ready vector service interface
- RAG chat route wired for Groq-compatible chat completions
- Supabase service layer with local JSON fallback
- Analytics and inbox summary endpoints

## Setup

```bash
python -m venv backend\.venv
backend\.venv\Scripts\activate
pip install -r backend\requirements.txt
uvicorn backend.main:app --reload
```

## Development Flow

The project defaults to `MOCK_MODE=true`, so it runs without external credentials.

1. Start the API.
2. Open `http://localhost:8000/docs`.
3. Test the Phase 2 mock endpoints in Postman.
4. Add Gmail, Groq, and Supabase credentials after the mock flow is stable.

## Phase 2 Mock Endpoints

Base URL:

```text
http://localhost:8000
```

Health:

```http
GET /health
```

Mock emails:

```http
GET /emails
```

Inbox summary:

```http
GET /emails/summary
```

Threat alerts:

```http
GET /threats
```

Semantic search:

```http
POST /search
Content-Type: application/json

{
  "query": "interview invitation",
  "top_k": 3
}
```

Inbox chat:

```http
POST /chat
Content-Type: application/json

{
  "question": "Do I have any urgent threats in my inbox?",
  "top_k": 3
}
```

## Phase 3 Gmail Fetch

OAuth login:

```http
GET /auth/google/login
```

OAuth callback:

```http
GET /auth/google/callback?code=GOOGLE_AUTH_CODE
```

Initial inbox sync:

```http
POST /emails/sync?mode=initial
```

Uses this Gmail search query:

```text
newer_than:7d in:inbox
```

Background inbox sync:

```http
POST /emails/sync?mode=background
```

Uses this Gmail search query:

```text
newer_than:1h in:inbox
```

In `MOCK_MODE=true`, these endpoints return deterministic mock data. For real Gmail fetches, set Google credentials in `.env`, set `MOCK_MODE=false`, visit `/auth/google/login`, then call `/emails/sync`.

## Supabase Metadata Table

Create this table before storing synced email metadata in Supabase:

```sql
create table if not exists email_metadata (
  email_id text primary key,
  category text not null,
  priority integer not null,
  sender text not null,
  summary text not null,
  created_at timestamptz default now()
);
```

During `POST /emails/sync`, the backend stores:

```text
email_id, category, priority, sender, summary
```

If Supabase is unavailable, the same metadata is mirrored locally to `backend/data/email_metadata.json`.

## Phase 4 AI Pipeline

After Gmail fetching works, `POST /emails/sync` runs this pipeline:

```text
Email text
-> Clean content
-> Classify category + priority
-> Detect threat
-> Generate embedding
-> Store in FAISS
-> Store metadata in Supabase
```

The API response includes `pipeline_steps` so you can confirm the flow in Postman.

Vector files:

```text
backend/vector_store/emails.json
backend/vector_store/emails.faiss
```

Metadata fields stored in Supabase:

```text
email_id, category, priority, sender, summary
```

## Phase 5 RAG APIs

Semantic search:

```http
POST /search
Content-Type: application/json

{
  "query": "Show urgent placement related emails",
  "top_k": 5
}
```

Inbox chat:

```http
POST /chat
Content-Type: application/json

{
  "question": "Summarize my important emails today"
}
```

The chat service trims each retrieved email body before calling Groq so large Gmail messages do not exceed the model API payload limit.

RAG chat flow:

```text
User question
-> Semantic retrieval
-> Relevant email chunks
-> Groq LLM
-> AI-generated contextual response
```

Test urgent reply detection:

```http
POST /chat
Content-Type: application/json

{
  "question": "What urgent emails need replies?"
}
```

The response includes `rag_steps` and `retrieved_chunks` so you can verify retrieval and context in Postman.

## Background Fetching

When the backend is running, it automatically checks Gmail every hour without the user opening the app.

Settings:

```env
BACKGROUND_SYNC_ENABLED=true
BACKGROUND_SYNC_INTERVAL_SECONDS=3600
BACKGROUND_SYNC_LIMIT=25
```

Manual initial sync:

```http
POST /emails/sync?mode=initial&limit=25
```

Uses:

```text
newer_than:7d in:inbox
```

Automatic/background sync:

```text
Every 1 hour while the backend process is running
```

If there is no previous sync timestamp, it uses:

```text
newer_than:1h in:inbox
```

If the last sync was recorded, it uses:

```text
after:<last_sync_unix_timestamp> in:inbox
```

Old emails remain stored and searchable:

```text
backend/data/emails.json
backend/vector_store/emails.json
backend/vector_store/emails.faiss
Supabase email_metadata table
```

Check sync state:

```http
GET /emails/sync/status
```

## AI Summary Flow

When the user clicks "Summarize today's inbox", call:

```http
GET /emails/summary
```

The backend flow:

```text
Retrieve today's emails using LOCAL_TIMEZONE
-> Group by semantic category
-> Count important items and threats
-> Ask Groq to generate a concise summary
```

The response includes:

```text
summary
highlights
total_today
important_count
urgent_count
threat_count
category_counts
```

## Environment Variables

Copy real values into `.env` when enabling integrations:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GROQ_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notes

The current vector store persists embeddings and metadata to `vector_store/emails.json`. The service is intentionally shaped so a FAISS index can replace the JSON cosine search without changing route contracts.
