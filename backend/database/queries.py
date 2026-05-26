EMAILS_TABLE = "emails"
EMAIL_METADATA_TABLE = "email_metadata"
USERS_TABLE = "users"

UPSERT_EMAIL_COLUMNS = [
    "id",
    "account_email",
    "thread_id",
    "sender",
    "recipient",
    "subject",
    "snippet",
    "body",
    "received_at",
    "category",
    "priority",
    "threat_level",
    "threat_score",
    "suggested_actions",
    "metadata",
]

UPSERT_EMAIL_METADATA_COLUMNS = [
    "email_id",
    "account_email",
    "category",
    "priority",
    "sender",
    "summary",
]
