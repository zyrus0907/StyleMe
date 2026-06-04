"""Supabase Storage helpers.

Flow:
  1. Client asks for a signed UPLOAD url + token (presign).
  2. Client uploads the file directly to storage with that token.
  3. We store only the object *path* in Postgres (not a URL, since signed
     URLs expire). When we need to read a file (e.g. to send to fal.ai),
     we mint a fresh signed READ url on demand.

NOTE: supabase-py method names can differ slightly between versions. These
target supabase==2.9.x. If you bump the version and a call breaks, check the
storage module signatures.
"""
import uuid

from ..config import settings
from ..db import supabase

BUCKET = settings.STORAGE_BUCKET


def make_path(user_id: str, kind: str, ext: str = "jpg") -> str:
    """e.g. '<user_id>/photos/<uuid>.jpg' — user_id prefix keeps files scoped."""
    return f"{user_id}/{kind}/{uuid.uuid4()}.{ext}"


def presign_upload(path: str) -> dict:
    """Return a signed URL + token the client uses to upload directly."""
    res = supabase.storage.from_(BUCKET).create_signed_upload_url(path)
    # res keys: 'signed_url' / 'token' / 'path' (snake or camel by version)
    return {
        "path": path,
        "signed_url": res.get("signed_url") or res.get("signedUrl"),
        "token": res.get("token"),
    }


def signed_read_url(path: str, expires_in: int = 3600) -> str:
    """Time-limited public URL for reading. fal.ai fetches this URL."""
    res = supabase.storage.from_(BUCKET).create_signed_url(path, expires_in)
    return res.get("signedURL") or res.get("signed_url") or res.get("signedUrl")
