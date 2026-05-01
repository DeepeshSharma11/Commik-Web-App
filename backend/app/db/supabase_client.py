from supabase import create_client, Client
from app.core.config import settings

def get_supabase_service() -> Client:
    """
    Returns a Supabase client using the SERVICE ROLE KEY.
    CRITICAL: This bypasses Row Level Security (RLS). 
    Use ONLY for admin operations or backend-to-backend syncs.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase URL or Service Role Key is missing from env.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_supabase_anon() -> Client:
    """
    Returns a Supabase client using the ANON KEY.
    Standard client for public operations.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL or Anon Key is missing from env.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
