"""Single shared Supabase client (service-role key).

Using the service role means these calls bypass Row Level Security, so we
ALWAYS filter by user_id ourselves in every query. The user_id comes from the
verified JWT (see deps.py), never from the request body.
"""
from supabase import create_client, Client

from .config import settings

supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY,
)
